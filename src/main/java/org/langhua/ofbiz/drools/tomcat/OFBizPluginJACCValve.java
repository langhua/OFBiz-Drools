/*
 * Copyright 2019 Langhua Tech.
 *  
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *    http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.langhua.ofbiz.drools.tomcat;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.Principal;
import java.security.acl.Group;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import javax.security.auth.Subject;
import javax.security.jacc.PolicyContext;
import javax.security.jacc.PolicyContextException;
import javax.security.jacc.PolicyContextHandler;
import javax.servlet.ServletException;
import javax.servlet.ServletRequestEvent;
import javax.servlet.ServletRequestListener;

import org.apache.catalina.Context;
import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import org.apache.catalina.realm.GenericPrincipal;
import org.apache.catalina.users.AbstractRole;
import org.apache.catalina.users.AbstractUser;
import org.apache.catalina.valves.ValveBase;
import org.apache.ofbiz.base.util.Debug;
import org.kie.integration.tomcat.BasicAuthorizationPrincipal;

/**
 * Copied and Modified from org.kie.integration.tomcat.JACCValve
 * 
 * The modification is to prevent from handler duplicated register warning.
 */
public class OFBizPluginJACCValve extends ValveBase {

    private static final String module = OFBizPluginJACCValve.class.getName();

    private static ThreadLocal<Request> currentRequest = new ThreadLocal<Request>();
    
    public OFBizPluginJACCValve() {
        try {
            if (PolicyContext.getHandlerKeys().contains("javax.security.auth.Subject.container")) {
                return;
            }
            PolicyContext.registerHandler("javax.security.auth.Subject.container", new PolicyContextHandler() {
                
                public boolean supports(String key) throws PolicyContextException {
                    if ("javax.security.auth.Subject.container".equals(key)) {
                        return true;
                    }
                    
                    return false;
                }
                
                public String[] getKeys() throws PolicyContextException {
                    return new String[]{"javax.security.auth.Subject.container"};
                }
                
                public Object getContext(String key, Object data)
                        throws PolicyContextException {

                    Request req = currentRequest.get();
                    if (req == null || req.getPrincipal() == null) {
                        return null;
                    }

                    Set<Principal> principals = new HashSet<Principal>();
                    principals.add(req.getPrincipal());
                    principals.add(getGroup(req.getPrincipal()));
                    if (req.getPrincipal() instanceof GenericPrincipal) {
                        try {
                            String name = ((GenericPrincipal) req.getPrincipal()).getName();
                            String password = ((GenericPrincipal) req.getPrincipal()).getPassword();
                            String basicAuthHeader = "Basic " + Base64.getEncoder().encodeToString((name + ":" + password).getBytes("UTF-8"));
                            principals.add(new BasicAuthorizationPrincipal(basicAuthHeader));
                        } catch (UnsupportedEncodingException e) {
                            Debug.logWarning("UnsupportedEncodingException while preparing basic auth principal", module);
                        }
                    }

                    final Subject s = new Subject(false, principals , Collections.EMPTY_SET, Collections.EMPTY_SET);
                    return s;
                }
            }, false);
            
        
        } catch (Exception e) {
            Debug.logError(e, module);
        }
    }

    @Override
    public void invoke(Request request, Response response) throws IOException,
            ServletException {
        currentRequest.set(request);
        wrapListeners(request);
        try {
            getNext().invoke(request, response);
        } finally {
            currentRequest.set(null);
        }
    }


    protected Group getGroup(Principal principal) {
        Group group = new Group() {
            
            private List<Principal> members = new ArrayList<Principal>();
            public String getName() {
                return "Roles";
            }
            
            public boolean removeMember(Principal user) {
                return members.remove(user);
            }
            
            public Enumeration<? extends Principal> members() {
                
                return Collections.enumeration(members);
            }
            
            public boolean isMember(Principal member) {
                return members.contains(member);
            }
            
            public boolean addMember(Principal user) {
                
                return members.add(user);
            }
        };
        if (principal instanceof AbstractUser) {
            Iterator<?> it = ((AbstractUser) principal).getRoles();

            while (it.hasNext()) {
                AbstractRole user = ((AbstractRole) it.next());
                group.addMember(user);
                
            }
        } else if (principal instanceof GenericPrincipal) {
            String[] roles = ((GenericPrincipal) principal).getRoles();
            for (final String role : roles) {
                group.addMember(new Principal() {
                    
                    public String getName() {
                        return role;
                    }
                });
            }
        }
        
        return group;
    }

    protected void wrapListeners(Request request) {
        Context context = request.getContext();

        Object[] listeners = context.getApplicationEventListeners();
        for (int i = 0; i < listeners.length; i++) {
            if (listeners[i] instanceof ServletRequestListener && !(listeners[i] instanceof WrappedServletRequestListener)) {
                listeners[i] = new WrappedServletRequestListener((ServletRequestListener)listeners[i]);
            }
        }
    }

    /**
     * Wrapper for ServletRequestListener to overcome bug in WELD on tomcat that causes
     * NPE when request is destroyed, until it gets fixed let's catch the exception as
     * it does not cause any harm as request was already completed and once cleaned.
     */
    private static class WrappedServletRequestListener implements ServletRequestListener {
        private ServletRequestListener delegate;

        WrappedServletRequestListener(ServletRequestListener delegate) {
            this.delegate = delegate;
        }
        @Override
        public void requestDestroyed(ServletRequestEvent servletRequestEvent) {
            try {
                delegate.requestDestroyed(servletRequestEvent);
            } catch (Exception e) {
                Debug.logVerbose("Exception at request destroy {}", module, e.getMessage(), e);
            }
        }

        @Override
        public void requestInitialized(ServletRequestEvent servletRequestEvent) {

            try {
                delegate.requestInitialized(servletRequestEvent);
            } catch (Exception e) {
                Debug.logVerbose("Exception at request initialization {}", module, e.getMessage(), e);
            }
        }
    }
}
