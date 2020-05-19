/*
 * Copyright 2019 Langhua Tech.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.langhua.ofbiz.drools.authentication;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.catalina.realm.GenericPrincipal;
import org.apache.ofbiz.base.util.Debug;
import org.apache.ofbiz.base.util.UtilMisc;
import org.apache.ofbiz.base.util.UtilValidate;
import org.apache.ofbiz.catalina.container.OFBizRealm;
import org.apache.ofbiz.entity.Delegator;
import org.apache.ofbiz.entity.DelegatorFactory;
import org.apache.ofbiz.entity.GenericEntityException;
import org.apache.ofbiz.entity.GenericValue;
import org.apache.ofbiz.entity.util.EntityQuery;
import org.apache.ofbiz.service.GenericServiceException;
import org.apache.ofbiz.service.LocalDispatcher;
import org.apache.ofbiz.service.ServiceDispatcher;
import org.apache.ofbiz.service.ServiceUtil;

/**
 *
 * Implementation of <b>Realm</b> that works with OFBiz.
 *
 * <p>For a <b>Realm</b> implementation that supports connection pooling and
 * doesn't require synchronization of <code>authenticate()</code>,
 * <code>getPassword()</code>, <code>roles()</code> and
 * <code>getPrincipal()</code>.</p>
 *
 */
public class OFBizDroolsRealm extends OFBizRealm {
    
    public static final String module = OFBizDroolsRealm.class.getName();
    
    /**
     * Return the Principal associated with the specified username and
     * credentials, if there is one; otherwise return <code>null</code>.
     *
     * @param username Username of the Principal to look up
     * @param credentials Password or other credentials to use in
     *  authenticating this username
     * @return the associated principal, or <code>null</code> if there is none.
     */
    @Override
    public Principal authenticate(String username, String credentials) {
        Delegator delegator = DelegatorFactory.getDelegator(null);
        LocalDispatcher dispatcher = ServiceDispatcher.getLocalDispatcher("default", delegator);
        try {
            Map<String, Object> results = dispatcher.runSync("userLogin", UtilMisc.toMap("login.username", username, "login.password", credentials));
            if (!ServiceUtil.isSuccess(results)) {
                Debug.logError("[" + username + "] failed to login OFBiz.", module);
                return null;
            }
        } catch (GenericServiceException e) {
            Debug.logError(e, module);
            return null;
        }
        return (new GenericPrincipal(username, credentials, getRoles(delegator, username)));
    }

    /**
     * Return the roles associated with the given user name.
     * @param username The user name
     * @return an array list of the role names
     */
    protected ArrayList<String> getRoles(Delegator delegator, String username) {
        try {
            List<GenericValue> securityGroups = EntityQuery.use(delegator)
                                                           .from("DroolsUserRoleView")
                                                           .where("userLoginId", username)
                                                           .cache(false)
                                                           .filterByDate()
                                                           .select("roleName")
                                                           .queryList();
            if (UtilValidate.isNotEmpty(securityGroups)) {
                ArrayList<String> roles = new ArrayList<String>();
                for (GenericValue securityGroup : securityGroups) {
                    String role = securityGroup.getString("roleName");
                    if (UtilValidate.isNotEmpty(role) && !roles.contains(role)) {
                        roles.add(role);
                    }
                }
                return roles;
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return null;
    }

}
