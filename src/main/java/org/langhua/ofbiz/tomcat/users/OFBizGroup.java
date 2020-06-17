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

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.function.Function;

import org.apache.catalina.Role;
import org.apache.catalina.User;
import org.apache.catalina.UserDatabase;
import org.apache.catalina.users.AbstractGroup;
import org.apache.ofbiz.base.util.Debug;
import org.apache.ofbiz.base.util.UtilValidate;
import org.apache.ofbiz.entity.GenericEntityException;
import org.apache.ofbiz.entity.GenericValue;
import org.apache.ofbiz.entity.util.EntityQuery;
import org.apache.tomcat.util.buf.StringUtils;

/**
 * OFBiz implementation of {@link org.apache.catalina.Group} for the
 * {@link OFBizUserDatabase} implementation of {@link UserDatabase}.
 *
 */
public class OFBizGroup extends AbstractGroup {
    
    public static final String module = OFBizGroup.class.getName();

    /** The {@link OFBizUserDatabase} that owns this group */
    protected final OFBizUserDatabase database;
    
    /** The partyId of this group */
    protected final String partyId;

    /**
     * Package-private constructor used by the factory method in
     * {@link MemoryUserDatabase}.
     *
     * @param database The {@link MemoryUserDatabase} that owns this group
     * @param groupname Group name of this group
     * @param description Description of this group
     */
    OFBizGroup(OFBizUserDatabase database, String partyId, String groupname, String description) {
        super();
        this.database = database;
        this.partyId = partyId;
        setGroupname(groupname);
        setDescription(description);
    }

    /**
     * Return the set of {@link Role}s assigned specifically to this group.
     */
    @Override
    public Iterator<Role> getRoles() {
        return getGroupRoles().iterator();
    }
    
    protected List<Role> getGroupRoles() {
        List<Role> roles = new ArrayList<Role>();
        try {
            List<GenericValue> roleValues = EntityQuery.use(database.delegator)
                                                        .from("DroolsGroupRoleView")
                                                        .where("groupName", groupname)
                                                        .filterByDate()
                                                        .cache(false)
                                                        .select("securityGroupId", "midRoleTypeId", "roleName", "roleDescription")
                                                        .queryList();
            if (UtilValidate.isNotEmpty(roleValues)) {
                for (GenericValue roleValue : roleValues) {
                    Role role = new OFBizRole(database, roleValue.getString("securityGroupId"),
                                                        roleValue.getString("midRoleTypeId"),
                                                        roleValue.getString("roleName"),
                                                        roleValue.getString("roleDescription"));
                    roles.add(role);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return roles;
    }

    /**
     * Return the {@link UserDatabase} within which this Group is defined.
     */
    @Override
    public UserDatabase getUserDatabase() {
        return this.database;
    }

    /**
     * Return the set of {@link org.apache.catalina.User}s that are members of this group.
     */
    @Override
    public Iterator<User> getUsers() {
        List<User> users = new ArrayList<User>();
        List<GenericValue> userValues = null;
        try {
            userValues = EntityQuery.use(database.delegator)
                                    .from("DroolsUserGroupView")
                                    .where("groupName", groupname)
                                    .filterByDate("userFromDate", "userThruDate", "fromDate", "thruDate")
                                    .cache(false)
                                    .select("userLoginId", "userPartyId", "firstName", "lastName")
                                    .queryList();
            if (UtilValidate.isNotEmpty(userValues)) {
                for (GenericValue userValue : userValues) {
                    User user = new OFBizUser(database, userValue.getString("userLoginId"), 
                                                        userValue.getString("partyId"),
                                                        "",
                                                        OFBizUserDatabase.formatUsername(userValue.getString("firstName"), userValue.getString("lastName")));
                    users.add(user);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return users.iterator();
    }

    /**
     * Add a new {@link Role} to those assigned specifically to this group.
     *
     * @param role The new role
     */
    @Override
    public void addRole(Role role) {
        if (isInRole(role)) {
            return;
        }
        try {
            GenericValue roleValue = EntityQuery.use(database.delegator)
                                                .from("DroolsRoleView")
                                                .where("roleName", role.getRolename())
                                                .filterByDate("roleFromDate", "roleThruDate")
                                                .cache(false)
                                                .select("securityGroupId")
                                                .queryFirst();
            String roleTypeId = roleValue.getString("midRoleTypeId");
            GenericValue partyRoleValue = database.delegator.create("PartyRole", 
                                                                    "partyId", partyId,
                                                                    "roleTypeId", roleTypeId);
            database.delegator.createOrStore(partyRoleValue);
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Is this group specifically assigned the specified {@link Role}?
     *
     * @param role The role to check
     */
    @Override
    public boolean isInRole(Role role) {
        try {
            long count = EntityQuery.use(database.delegator)
                                    .from("DroolsGroupRoleView")
                                    .where("groupName", groupname, "roleName", role.getRolename())
                                    .filterByDate()
                                    .cache(false)
                                    .queryCount();
            if (count > 0) {
                return true;
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return false;
    }

    /**
     * Remove a {@link Role} from those assigned to this group.
     *
     * @param role The old role
     */
    @Override
    public void removeRole(Role role) {

//        synchronized (roles) {
//            roles.remove(role);
//        }

    }

    /**
     * Remove all {@link Role}s from those assigned to this group.
     */
    @Override
    public void removeRoles() {

//        synchronized (roles) {
//            roles.clear();
//        }

    }

    /**
     * <p>Return a String representation of this group in XML format.</p>
     */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("<group partyId=\"");
        sb.append(partyId);
        sb.append("\" groupname=\"");
        sb.append(groupname);
        sb.append("\"");
        if (description != null) {
            sb.append(" description=\"");
            sb.append(description);
            sb.append("\"");
        }
        List<Role> roles = getGroupRoles();
        if (roles.size() > 0) {
            sb.append(" roles=\"");
            StringUtils.join(roles, ',', new Function<Role, String>(){
                @Override public String apply(Role t) { return t.getRolename(); }}, sb);
            sb.append("\"");
        }
        sb.append("/>");
        return (sb.toString());
    }
}
