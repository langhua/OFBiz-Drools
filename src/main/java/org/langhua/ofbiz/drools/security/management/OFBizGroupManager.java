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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.apache.ofbiz.base.util.Debug;
import org.jboss.errai.security.shared.api.Group;
import org.langhua.ofbiz.tomcat.users.OFBizUserDatabase;
import org.uberfire.commons.config.ConfigProperties;
import org.uberfire.ext.security.management.api.Capability;
import org.uberfire.ext.security.management.api.CapabilityStatus;
import org.uberfire.ext.security.management.api.ContextualManager;
import org.uberfire.ext.security.management.api.GroupManager;
import org.uberfire.ext.security.management.api.GroupManagerSettings;
import org.uberfire.ext.security.management.api.UserSystemManager;
import org.uberfire.ext.security.management.api.exception.SecurityManagementException;
import org.uberfire.ext.security.management.api.exception.UnsupportedServiceCapabilityException;
import org.uberfire.ext.security.management.impl.GroupManagerSettingsImpl;
import org.uberfire.ext.security.management.search.GroupsIdentifierRuntimeSearchEngine;
import org.uberfire.ext.security.management.search.IdentifierRuntimeSearchEngine;
import org.uberfire.ext.security.management.util.SecurityManagementUtils;

/**
 * <p>Groups manager service provider implementation for Apache tomcat, when using default realm based on properties files.</p>
 *
 */
public class OFBizGroupManager extends BaseOFBizManager implements GroupManager,
                                                                     ContextualManager {

    private static final String module = OFBizGroupManager.class.getName();

    IdentifierRuntimeSearchEngine<Group> groupsSearchEngine;

    public OFBizGroupManager() {
        this(new ConfigProperties(System.getProperties()));
    }

    public OFBizGroupManager(final Map<String, String> gitPrefs) {
        this(new ConfigProperties(gitPrefs));
    }

    public OFBizGroupManager(final ConfigProperties gitPrefs) {
        loadConfig(gitPrefs);
    }

    @Override
    public void initialize(UserSystemManager userSystemManager) throws Exception {
        groupsSearchEngine = new GroupsIdentifierRuntimeSearchEngine();
    }

    @Override
    public void destroy() throws Exception {

    }

    @Override
    public SearchResponse<Group> search(SearchRequest request) throws SecurityManagementException {
        OFBizUserDatabase userDatabase = getDatabase();
        Iterator<org.apache.catalina.Group> groups = userDatabase.getGroups();
        Collection<String> groupIdentifiers = new ArrayList<String>();
        if (groups != null) {
            while (groups.hasNext()) {
                org.apache.catalina.Group group = groups.next();
                String groupname = group.getGroupname();
                groupIdentifiers.add(groupname);
            }
        }
        return groupsSearchEngine.searchByIdentifiers(groupIdentifiers,
                                                      request);
    }

    @Override
    public Group get(String identifier) throws SecurityManagementException {
        OFBizUserDatabase userDatabase = getDatabase();
        org.apache.catalina.Group group = getGroup(userDatabase, identifier);
        return createGroup(group);
    }

    @Override
    public Group create(Group entity) throws SecurityManagementException {
        if (entity == null) {
            throw new NullPointerException();
        }
        OFBizUserDatabase userDatabase = getDatabase();
        String name = entity.getName();
        userDatabase.createGroup(name, name);
        return entity;
    }

    @Override
    public Group update(Group entity) throws SecurityManagementException {
        throw new UnsupportedServiceCapabilityException(Capability.CAN_UPDATE_GROUP);
    }

    @Override
    public void delete(String... identifiers) throws SecurityManagementException {
        if (identifiers == null) {
            throw new NullPointerException();
        }
        OFBizUserDatabase userDatabase = getDatabase();
        for (String identifier : identifiers) {
            org.apache.catalina.Group group = getGroup(userDatabase, identifier);
            userDatabase.removeGroup(group);
        }
    }

    @Override
    public GroupManagerSettings getSettings() {
        final Map<Capability, CapabilityStatus> capabilityStatusMap = new HashMap<Capability, CapabilityStatus>(8);
        for (final Capability capability : SecurityManagementUtils.GROUPS_CAPABILITIES) {
            capabilityStatusMap.put(capability,
                                    getCapabilityStatus(capability));
        }
        return new GroupManagerSettingsImpl(capabilityStatusMap,
                                            true);
    }

    protected CapabilityStatus getCapabilityStatus(Capability capability) {
        if (capability != null) {
            switch (capability) {
                case CAN_SEARCH_GROUPS:
                case CAN_ADD_GROUP:
                case CAN_READ_GROUP:
                case CAN_DELETE_GROUP:
                    return CapabilityStatus.ENABLED;
            }
        }
        return CapabilityStatus.UNSUPPORTED;
    }

    @Override
    public void assignUsers(String name,
                            Collection<String> users) throws SecurityManagementException {
        if (name == null) {
            throw new NullPointerException();
        }
        if (users != null) {
            OFBizUserDatabase userDatabase = getDatabase();
            org.apache.catalina.Role role = getRole(userDatabase,
                                                    name);
            for (String username : users) {
                org.apache.catalina.User user = getUser(userDatabase,
                                                        username);
                user.addRole(role);
            }
        }
    }
}
