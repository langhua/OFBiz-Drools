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
package org.langhua.ofbiz.tomcat.users;

import org.apache.catalina.UserDatabase;
import org.apache.catalina.users.AbstractRole;

/**
 * OFBiz implementation of {@link org.apache.catalina.Role} for the
 * {@link OFBizUserDatabase} implementation of {@link UserDatabase}.
 *
 */
public class OFBizRole extends AbstractRole {

    /** The {@link OFBizUserDatabase} that owns this role */
    protected final OFBizUserDatabase database;
    
    /** The securityGroupId of this role */
    protected final String securityGroupId;
    
    /** The roleTypeId of this role */
    protected final String roleTypeId;

    OFBizRole(OFBizUserDatabase database, String securityGroupId, String roleTypeId, String rolename, String description) {
        super();
        this.database = database;
        this.securityGroupId = securityGroupId;
        this.roleTypeId = roleTypeId;
        setRolename(rolename);
        setDescription(description);
    }

    /**
     * Return the {@link UserDatabase} within which this role is defined.
     */
    @Override
    public UserDatabase getUserDatabase() {
        return this.database;
    }

    /**
     * <p>Return a String representation of this role in XML format.</p>
     */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("<role roleTypeId=\"");
        sb.append(roleTypeId);
        sb.append("\" rolename=\"");
        sb.append(rolename);
        sb.append("\"");
        if (description != null) {
            sb.append(" description=\"");
            sb.append(description);
            sb.append("\"");
        }
        sb.append("/>");
        return (sb.toString());
    }
}
