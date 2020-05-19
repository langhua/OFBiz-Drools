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

package org.langhua.ofbiz.drools.security.management;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.jboss.errai.security.shared.api.Group;
import org.jboss.errai.security.shared.api.Role;
import org.jboss.errai.security.shared.api.identity.User;
import org.langhua.ofbiz.drools.security.management.api.exception.RoleNotFoundException;
import org.langhua.ofbiz.tomcat.users.OFBizUser;
import org.langhua.ofbiz.tomcat.users.OFBizUserDatabase;
import org.uberfire.commons.config.ConfigProperties;
import org.uberfire.ext.security.management.api.UserManager;
import org.uberfire.ext.security.management.api.exception.GroupNotFoundException;
import org.uberfire.ext.security.management.api.exception.UserNotFoundException;
import org.uberfire.ext.security.management.impl.UserAttributeImpl;
import org.uberfire.ext.security.management.util.SecurityManagementUtils;

/**
 * <p>Base users and groups management methods for the OFBiz(tomcat) provider implementations.</p>
 * 
 */
public abstract class BaseOFBizManager {

    public static final String module = BaseOFBizManager.class.getName();
    public static final String ATTRIBUTE_USER_FULLNAME = "user.fullName";
    protected static final UserManager.UserAttribute USER_FULLNAME = new UserAttributeImpl(ATTRIBUTE_USER_FULLNAME,
                                                                                           false,
                                                                                           true,
                                                                                           "Full name");
    protected static final Collection<UserManager.UserAttribute> USER_ATTRIBUTES = Arrays.asList(USER_FULLNAME);
    
    protected static boolean isConfigPropertySet(ConfigProperties.ConfigProperty property) {
        if (property == null) {
            return false;
        }
        String value = property.getValue();
        return !isEmpty(value);
    }

    protected static boolean isEmpty(String s) {
        return s == null || s.trim().length() == 0;
    }

    protected void loadConfig(final ConfigProperties config) {
        // initializeTomcatProperties();
    }

    protected OFBizUser getUser(OFBizUserDatabase database,
                                               String identifier) {
        OFBizUser user = database.findUser(identifier);
        if (user == null) {
            throw new UserNotFoundException(identifier);
        }
        return user;
    }

    protected org.apache.catalina.Group getGroup(OFBizUserDatabase database, String identifier) {
        org.apache.catalina.Group group = database.findGroup(identifier);
        if (group == null) {
            throw new GroupNotFoundException(identifier);
        }
        return group;
    }

    protected org.apache.catalina.Role getRole(OFBizUserDatabase database,
                                               String identifier) {
        org.apache.catalina.Role role = database.findRole(identifier);
        if (role == null) {
            throw new RoleNotFoundException(identifier);
        }
        return role;
    }

    protected User createUser(org.apache.catalina.User user,
                              Iterator<org.apache.catalina.Group> groups,
                              Iterator<org.apache.catalina.Role> roles) {
        if (user == null) {
            return null;
        }
        final Set<Group> _groups = new HashSet<Group>();
        final Set<Role> _roles = new HashSet<Role>();
        if (groups != null && groups.hasNext()) {
            while (groups.hasNext()) {
                org.apache.catalina.Group group = groups.next();
                String name = group.getGroupname();
                _groups.add(SecurityManagementUtils.createGroup(name));
            }
        }
        if (roles != null && roles.hasNext()) {
            while (roles.hasNext()) {
                org.apache.catalina.Role role = roles.next();
                String name = role.getRolename();
                _roles.add(SecurityManagementUtils.createRole(name));
            }
        }
        
        return SecurityManagementUtils.createUser(user.getName(),
                                                  _groups,
                                                  _roles);
    }

    protected Group createGroup(org.apache.catalina.Group group) {
        if (group == null) {
            return null;
        }
        return SecurityManagementUtils.createGroup(group.getGroupname());
    }

    protected Role createRole(org.apache.catalina.Role role) {
        if (role == null) {
            return null;
        }
        return SecurityManagementUtils.createRole(role.getRolename());
    }

    protected OFBizUserDatabase getDatabase() {
        OFBizUserDatabase database = new OFBizUserDatabase();
        return database;
    }
}
