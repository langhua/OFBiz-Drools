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

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.uberfire.ext.security.management.UberfireRoleManager;
import org.uberfire.ext.security.management.api.GroupManager;
import org.uberfire.ext.security.management.api.UserManager;
import org.uberfire.ext.security.management.service.AbstractUserManagementService;

/**
 * The OFBiz user management service beans.
 * 
 */
@ApplicationScoped
@Named(value = "OFBizUserManagementService")
public class OFBizUserManagementService extends AbstractUserManagementService {

    OFBizUserManager userManager;

    OFBizGroupManager groupManager;
    
    public OFBizUserManagementService() {
        super(null);
    }

    @Inject
    public OFBizUserManagementService(final OFBizUserManager userManager,
                                       final OFBizGroupManager groupManager,
                                       final @Named("uberfireRoleManager") UberfireRoleManager roleManager) {
        super(roleManager);
        this.userManager = userManager;
        this.groupManager = groupManager;
    }

    @Override
    public UserManager users() {
        return userManager;
    }

    @Override
    public GroupManager groups() {
        return groupManager;
    }
}
