/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates.
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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.apache.catalina.Group;
import org.apache.catalina.Role;
import org.apache.ofbiz.base.util.UtilValidate;
import org.jboss.errai.security.shared.api.identity.User;
import org.langhua.ofbiz.tomcat.users.OFBizUser;
import org.langhua.ofbiz.tomcat.users.OFBizUserDatabase;
import org.uberfire.commons.config.ConfigProperties;
import org.uberfire.ext.security.management.api.Capability;
import org.uberfire.ext.security.management.api.CapabilityStatus;
import org.uberfire.ext.security.management.api.ContextualManager;
import org.uberfire.ext.security.management.api.UserManager;
import org.uberfire.ext.security.management.api.UserManagerSettings;
import org.uberfire.ext.security.management.api.UserSystemManager;
import org.uberfire.ext.security.management.api.exception.SecurityManagementException;
import org.uberfire.ext.security.management.impl.UserManagerSettingsImpl;
import org.uberfire.ext.security.management.search.IdentifierRuntimeSearchEngine;
import org.uberfire.ext.security.management.search.UsersIdentifierRuntimeSearchEngine;
import org.uberfire.ext.security.management.util.SecurityManagementUtils;

import static org.kie.soup.commons.validation.PortablePreconditions.checkNotNull;

/**
 * <p>Users manager service provider implementation for Apache tomcat, when using default realm based on properties files.</p>
 *
 */
public class OFBizUserManager extends BaseOFBizManager implements UserManager,
                                                                    ContextualManager {

    UserSystemManager userSystemManager;
    IdentifierRuntimeSearchEngine<User> usersSearchEngine;

    public OFBizUserManager() {
        this(new ConfigProperties(System.getProperties()));
    }

    public OFBizUserManager(final Map<String, String> gitPrefs) {
        this(new ConfigProperties(gitPrefs));
    }

    public OFBizUserManager(final ConfigProperties gitPrefs) {
        loadConfig(gitPrefs);
    }

    @Override
    public void initialize(final UserSystemManager userSystemManager) throws Exception {
        this.userSystemManager = userSystemManager;
        usersSearchEngine = new UsersIdentifierRuntimeSearchEngine();
    }

    @Override
    public void destroy() throws Exception {

    }

    @Override
    public SearchResponse<User> search(SearchRequest request) throws SecurityManagementException {
        OFBizUserDatabase userDatabase = new OFBizUserDatabase();
        Iterator<org.apache.catalina.User> users = userDatabase.getUsers();
        Collection<String> userIdentifiers = new ArrayList<String>();
        if (users != null) {
            while (users.hasNext()) {
                org.apache.catalina.User user = users.next();
                String username = user.getUsername();
                userIdentifiers.add(username);
            }
        }
        return usersSearchEngine.searchByIdentifiers(userIdentifiers,
                                                     request);
    }

    @Override
    public User get(String identifier) throws SecurityManagementException {
        checkNotNull("identifier", identifier);
        OFBizUserDatabase userDatabase = getDatabase();
        OFBizUser user = getUser(userDatabase, identifier);
        Iterator<Role> roles = user.getRoles();
        Iterator<Group> groups = user.getGroups();
        User u = createUser(user, groups, roles);
        u.setProperty(ATTRIBUTE_USER_FULLNAME, user.getFullName() != null ? user.getFullName() : "");
        return u;
    }

    @Override
    public User create(User entity) throws SecurityManagementException {
        checkNotNull("entity", entity);
        OFBizUserDatabase userDatabase = getDatabase();
        String username = entity.getIdentifier();
        String fullName = entity.getProperty(ATTRIBUTE_USER_FULLNAME);
        userDatabase.createUser(username,
                                "",
                                fullName != null ? fullName : "");
        return entity;
    }

    @Override
    public User update(User entity) throws SecurityManagementException {
        checkNotNull("entity", entity);
        OFBizUserDatabase userDatabase = getDatabase();
        OFBizUser user = getUser(userDatabase, entity.getIdentifier());
        String fName = entity.getProperty(ATTRIBUTE_USER_FULLNAME);
        user.setFullName(fName != null ? fName : "");
        return entity;
    }

    @Override
    public void delete(String... identifiers) throws SecurityManagementException {
        checkNotNull("identifiers", identifiers);
        OFBizUserDatabase userDatabase = getDatabase();
        for (String identifier : identifiers) {
            org.apache.catalina.User user = getUser(userDatabase, identifier);
            userDatabase.removeUser(user);
        }
    }

    @Override
    public UserManagerSettings getSettings() {
        final Map<Capability, CapabilityStatus> capabilityStatusMap = new HashMap<Capability, CapabilityStatus>(8);
        for (final Capability capability : SecurityManagementUtils.USERS_CAPABILITIES) {
            capabilityStatusMap.put(capability,
                                    getCapabilityStatus(capability));
        }
        return new UserManagerSettingsImpl(capabilityStatusMap,
                                           USER_ATTRIBUTES);
    }

    @Override
    public void assignGroups(String username,
                             Collection<String> groups) throws SecurityManagementException {
        Set<String> userGroups = SecurityManagementUtils.groupsToString(SecurityManagementUtils.getGroups(userSystemManager,
                                                                                                       username));
        Set<String> groupsToAdd = new HashSet<String>();
        Set<String> groupsToRemove = userGroups;
        for (String group : groups) {
            if (!userGroups.contains(group)) {
                groupsToAdd.add(group);
            } else {
                groupsToRemove.remove(group);
            }
        }
        if (UtilValidate.isNotEmpty(groupsToRemove) || UtilValidate.isNotEmpty(groupsToAdd)) {
            OFBizUserDatabase userDatabase = getDatabase();
            userDatabase.assignGroups(username, groupsToAdd, groupsToRemove);
        }
    }

    @Override
    public void assignRoles(String username,
                            Collection<String> roles) throws SecurityManagementException {
        Set<String> userRoles = SecurityManagementUtils.rolesToString(SecurityManagementUtils.getRoles(userSystemManager,
                                                                                                          username));
        Set<String> rolesToAdd = new HashSet<String>();
        Set<String> rolesToRemove = userRoles;
        for (String role : roles) {
            if (!userRoles.contains(role)) {
                rolesToAdd.add(role);
            } else {
                rolesToRemove.remove(role);
            }
        }
        if (UtilValidate.isNotEmpty(rolesToRemove) || UtilValidate.isNotEmpty(rolesToAdd)) {
            OFBizUserDatabase userDatabase = getDatabase();
            userDatabase.assignRoles(username, rolesToAdd, rolesToRemove);
        }
    }

    @Override
    public void changePassword(String username,
                               String newPassword) throws SecurityManagementException {
        checkNotNull("username", username);
        OFBizUserDatabase userDatabase = getDatabase();
        OFBizUser user = getUser(userDatabase, username);
        user.changePassword(newPassword);
    }

    protected CapabilityStatus getCapabilityStatus(Capability capability) {
        if (capability != null) {
            switch (capability) {
                case CAN_SEARCH_USERS:
                case CAN_ADD_USER:
                case CAN_UPDATE_USER:
                case CAN_DELETE_USER:
                case CAN_READ_USER:
                case CAN_MANAGE_ATTRIBUTES:
                case CAN_ASSIGN_GROUPS:
                    /** As it is using the UberfireRoleManager. **/
                case CAN_ASSIGN_ROLES:
                case CAN_CHANGE_PASSWORD:
                    return CapabilityStatus.ENABLED;
            }
        }
        return CapabilityStatus.UNSUPPORTED;
    }
}
