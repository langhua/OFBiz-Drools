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

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.function.Function;

import org.apache.catalina.Group;
import org.apache.catalina.Role;
import org.apache.catalina.UserDatabase;
import org.apache.catalina.users.AbstractUser;
import org.apache.ofbiz.base.crypto.HashCrypt;
import org.apache.ofbiz.base.util.Debug;
import org.apache.ofbiz.base.util.UtilDateTime;
import org.apache.ofbiz.base.util.UtilValidate;
import org.apache.ofbiz.common.login.LoginServices;
import org.apache.ofbiz.entity.GenericEntityException;
import org.apache.ofbiz.entity.GenericValue;
import org.apache.ofbiz.entity.condition.EntityCondition;
import org.apache.ofbiz.entity.condition.EntityOperator;
import org.apache.ofbiz.entity.util.EntityQuery;
import org.apache.ofbiz.entity.util.EntityUtilProperties;
import org.apache.tomcat.util.buf.StringUtils;
import org.apache.tomcat.util.security.Escape;

/**
 * OFBiz implementation of {@link org.apache.catalina.User} for the
 * {@link OFBizUserDatabase} implementation of {@link UserDatabase}.
 *
 */
public class OFBizUser extends AbstractUser {
    
    public static final String module = OFBizUser.class.getName();

    /** The {@link OFBizUserDatabase} that owns this user */
    protected final OFBizUserDatabase database;
    
    /** The partyId of this user */
    protected final String partyId;

    OFBizUser(OFBizUserDatabase database, String username, String partyId,
               String password, String fullName) {
        super();
        this.database = database;
        this.partyId = partyId;
        setUsername(username);
        setPassword(password);
        this.fullName = fullName;
    }

    /**
     * Return the set of {@link Group}s to which this user belongs.
     */
    @Override
    public Iterator<Group> getGroups() {
        return getUserGroups(username).iterator();
    }
    
    protected List<Group> getUserGroups(String userName) {
        List<Group> groups = new ArrayList<Group>();
        List<GenericValue> groupValues = null;
        try {
            groupValues = EntityQuery.use(database.delegator)
                                     .from("DroolsUserGroupView")
                                     .where("userLoginId", userName)
                                     .filterByDate("userFromDate", "userThruDate", "fromDate", "thruDate")
                                     .select("partyIdTo", "groupName", "groupDescription")
                                     .orderBy("groupName")
                                     .cache(false)
                                     .queryList();
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        if (UtilValidate.isNotEmpty(groupValues)) {
            for (GenericValue groupValue : groupValues) {
                Group group = new OFBizGroup(database, groupValue.getString("partyIdTo"),
                                                       groupValue.getString("groupName"),
                                                       groupValue.getString("groupDescription"));
                groups.add(group);
            }
        }
        return groups;
    }

    /**
     * Return the set of {@link Role}s assigned specifically to this user.
     */
    @Override
    public Iterator<Role> getRoles() {
        return getUserRoles(username).iterator();
    }
    
    protected List<Role> getUserRoles(String userName) {
        List<Role> roles = new ArrayList<Role>();
        List<GenericValue> roleValues = null;
        try {
            roleValues = EntityQuery.use(database.delegator)
                                    .from("DroolsUserRoleView")
                                    .where("userLoginId", username)
                                    .filterByDate("fromDate", "thruDate", "roleFromDate", "roleThruDate")
                                    .select("securityGroupId", "midRoleTypeId", "roleName", "roleDescription")
                                    .orderBy("roleName")
                                    .cache(false)
                                    .queryList();
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        if (UtilValidate.isNotEmpty(roleValues)) {
            for (GenericValue roleValue : roleValues) {
                Role role = new OFBizRole(database, roleValue.getString("securityGroupId"),
                                                    roleValue.getString("midRoleTypeId"),
                                                    roleValue.getString("roleName"),
                                                    roleValue.getString("roleDescription"));
                roles.add(role);
            }
        }
        return roles;
    }

    /**
     * Return the {@link UserDatabase} within which this User is defined.
     */
    @Override
    public UserDatabase getUserDatabase() {
        return this.database;
    }

    /**
     * Add a new {@link Group} to those this user belongs to.
     *
     * @param group The new group
     */
    @Override
    public void addGroup(Group group) {
        if (isInGroup(group)) {
            return;
        }
        try {
            GenericValue userGroupValue = database.delegator.create("PartyRelationship", 
                                                                    "partyIdFrom", partyId,
                                                                    "partyIdTo", ((OFBizGroup) group).partyId,
                                                                    "roleTypeIdFrom", "_NA_",
                                                                    "roleTypeIdTo", "_NA_",
                                                                    "fromDate", UtilDateTime.nowTimestamp());
            database.delegator.createOrStore(userGroupValue);
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Add a new {@link Role} to those assigned specifically to this user.
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
            String securityGroupId = roleValue.getString("securityGroupId");
            GenericValue userRoleValue = database.delegator.create("UserLoginSecurityGroup", 
                                                                   "userLoginId", username,
                                                                   "groupId", securityGroupId,
                                                                   "fromDate", UtilDateTime.nowTimestamp());
            database.delegator.createOrStore(userRoleValue);
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Is this user in the specified group?
     *
     * @param group The group to check
     */
    @Override
    public boolean isInGroup(Group group) {
        try {
            long count = EntityQuery.use(database.delegator)
                                    .from("DroolsUserGroupView")
                                    .where("userLoginId", username, "partyIdTo", ((OFBizGroup) group).partyId)
                                    .filterByDate("userFromDate", "userThruDate", "fromDate", "thruDate")
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
     * Is this user specifically assigned the specified {@link Role}?  This
     * method does <strong>NOT</strong> check for roles inherited based on
     * {@link Group} membership.
     *
     * @param role The role to check
     */
    @Override
    public boolean isInRole(Role role) {
        try {
            long count = EntityQuery.use(database.delegator)
                                    .from("DroolsUserRoleView")
                                    .where("userLoginId", username, "midRoleTypeId", ((OFBizRole) role).roleTypeId)
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
     * Remove a {@link Group} from those this user belongs to.
     *
     * @param group The old group
     */
    @Override
    public void removeGroup(Group group) {
        List<GenericValue> groupValues = null;
        try {
            groupValues = EntityQuery.use(database.delegator)
                                     .from("DroolsUserGroupView")
                                     .where("userLoginId", username, "partyIdTo", group.getGroupname())
                                     .filterByDate("fromDate", "thruDate", "userFromDate", "userThruDate")
                                     .cache(false)
                                     .select("userPartyId", "partyIdTo")
                                     .queryList();
            List<String> partyGroupIds = new ArrayList<String>();
            if (UtilValidate.isNotEmpty(groupValues)) {
                String partyId = groupValues.get(0).getString("userPartyId");
                for (GenericValue groupValue : groupValues) {
                    partyGroupIds.add(groupValue.getString("partyIdTo"));
                }
                groupValues = EntityQuery.use(database.delegator)
                                         .from("PartyRelationship")
                                         .where(EntityCondition.makeCondition("partyIdFrom", partyId),
                                                EntityCondition.makeCondition("partyIdTo", EntityOperator.IN, partyGroupIds))
                                         .filterByDate()
                                         .cache(false)
                                         .queryList();
                if (UtilValidate.isNotEmpty(groupValues)) {
                    Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                    List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
                    for (GenericValue groupValue : groupValues) {
                        groupValue.set("thruDate", nowTimestamp);
                        valuesToStore.add(groupValue);
                    }
                    database.delegator.storeAll(valuesToStore);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Remove all {@link Group}s from those this user belongs to.
     */
    @Override
    public void removeGroups() {
        List<GenericValue> groupValues = null;
        try {
            groupValues = EntityQuery.use(database.delegator)
                                     .from("DroolsUserGroupView")
                                     .where("userLoginId", username)
                                     .filterByDate("userFromDate", "userThruDate", "fromDate", "thruDate")
                                     .cache(false)
                                     .select("userPartyId", "partyIdTo")
                                     .queryList();
            List<String> partyGroupIds = new ArrayList<String>();
            if (UtilValidate.isNotEmpty(groupValues)) {
                String partyId = groupValues.get(0).getString("userPartyId");
                for (GenericValue groupValue : groupValues) {
                    partyGroupIds.add(groupValue.getString("partyGroupId"));
                }
                groupValues = EntityQuery.use(database.delegator)
                                         .from("PartyRelationship")
                                         .where(EntityCondition.makeCondition("partyIdFrom", partyId),
                                                EntityCondition.makeCondition("partyIdTo", EntityOperator.IN, partyGroupIds))
                                         .filterByDate()
                                         .cache(false)
                                         .queryList();
                if (UtilValidate.isNotEmpty(groupValues)) {
                    Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                    List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
                    for (GenericValue groupValue : groupValues) {
                        groupValue.set("thruDate", nowTimestamp);
                        valuesToStore.add(groupValue);
                    }
                    database.delegator.storeAll(valuesToStore);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Remove a {@link Role} from those assigned to this user.
     *
     * @param role The old role
     */
    @Override
    public void removeRole(Role role) {
        List<GenericValue> roleValues = null;
        try {
            roleValues = EntityQuery.use(database.delegator)
                                    .from("DroolsUserRoleView")
                                    .where("userLoginId", username, "roleName", role.getRolename())
                                    .filterByDate()
                                    .cache(false)
                                    .select("securityGroupId")
                                    .queryList();
            List<String> securityGroupIds = new ArrayList<String>();
            if (UtilValidate.isNotEmpty(roleValues)) {
                for (GenericValue roleValue : roleValues) {
                    securityGroupIds.add(roleValue.getString("securityGroupId"));
                }
                roleValues = EntityQuery.use(database.delegator)
                                        .from("UserLoginSecurityGroup")
                                        .where(EntityCondition.makeCondition("userLoginId", username),
                                               EntityCondition.makeCondition("groupId", EntityOperator.IN, securityGroupIds))
                                        .filterByDate()
                                        .cache(false)
                                        .queryList();
                if (UtilValidate.isNotEmpty(roleValues)) {
                    Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                    List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
                    for (GenericValue roleValue : roleValues) {
                        roleValue.set("thruDate", nowTimestamp);
                        valuesToStore.add(roleValue);
                    }
                    database.delegator.storeAll(valuesToStore);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Remove all {@link Role}s from those assigned to this user.
     */
    @Override
    public void removeRoles() {
        List<GenericValue> roleValues = null;
        try {
            roleValues = EntityQuery.use(database.delegator)
                                    .from("DroolsUserRoleView")
                                    .where("userLoginId", username)
                                    .filterByDate()
                                    .cache(false)
                                    .select("securityGroupId")
                                    .queryList();
            List<String> securityGroupIds = new ArrayList<String>();
            if (UtilValidate.isNotEmpty(roleValues)) {
                for (GenericValue roleValue : roleValues) {
                    securityGroupIds.add(roleValue.getString("securityGroupId"));
                }
                roleValues = EntityQuery.use(database.delegator)
                                        .from("UserLoginSecurityGroup")
                                        .where(EntityCondition.makeCondition("userLoginId", username),
                                               EntityCondition.makeCondition("groupId", EntityOperator.IN, securityGroupIds))
                                        .filterByDate()
                                        .cache(false)
                                        .queryList();
                if (UtilValidate.isNotEmpty(roleValues)) {
                    Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                    List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
                    for (GenericValue roleValue : roleValues) {
                        roleValue.set("thruDate", nowTimestamp);
                        valuesToStore.add(roleValue);
                    }
                    database.delegator.storeAll(valuesToStore);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Change the logon password of this user.
     *
     * @param password The new logon password
     */
    public void changePassword(String password) {
        try {
            GenericValue userLogin = EntityQuery.use(database.delegator)
                                                .from("UserLogin")
                                                .where("userLoginId", username)
                                                .queryOne();
            if (UtilValidate.isNotEmpty(userLogin)) {
                String newPassword = "";
                if (UtilValidate.isNotEmpty(password)) {
                    boolean useEncryption = "true".equals(EntityUtilProperties.getPropertyValue("security", "password.encrypt", database.delegator));
                    if (useEncryption) {
                        newPassword = HashCrypt.cryptUTF8(LoginServices.getHashType(), null, password);
                    } else {
                        newPassword = password;
                    }
                }
                userLogin.setString("currentPassword", newPassword);
                userLogin.store();
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Set the full name of this user.
     *
     * @param fullName The new full name
     */
    @Override
    public void setFullName(String fullName) {
        if (!this.fullName.equals(fullName)) {
            this.fullName = fullName;
            try {
                GenericValue personValue = EntityQuery.use(database.getDelegator())
                                                      .from("Person")
                                                      .where("partyId", partyId)
                                                      .cache(false)
                                                      .queryOne();
                personValue.setString("firstName", fullName);
                personValue.setString("lastName", "");
                personValue.store();
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
    }

    /**
     * <p>Return a String representation of this user in XML format.</p>
     *
     * <p><strong>IMPLEMENTATION NOTE</strong> - For backwards compatibility,
     * the reader that processes this entry will accept either
     * <code>username</code> or <code>name</code> for the username
     * property.</p>
     * @return the XML representation
     */
    public String toXml() {
        StringBuilder sb = new StringBuilder("<user username=\"");
        sb.append(Escape.xml(username));
        sb.append("\" password=\"");
        sb.append(Escape.xml(password));
        sb.append("\"");
        if (fullName != null) {
            sb.append(" fullName=\"");
            sb.append(Escape.xml(fullName));
            sb.append("\"");
        }
        List<Group> groups = getUserGroups(username);
        if (groups.size() > 0) {
            sb.append(" groups=\"");
            StringUtils.join(groups, ',', new Function<Group, String>() {
                @Override public String apply(Group t) {
                    return Escape.xml(t.getGroupname());
                }
            }, sb);
            sb.append("\"");
        }
        List<Role> roles = getUserRoles(username);
        if (roles.size() > 0) {
            sb.append(" roles=\"");
            StringUtils.join(roles, ',', new Function<Role, String>() {
                @Override public String apply(Role t) {
                    return Escape.xml(t.getRolename());
                }
            }, sb);
            sb.append("\"");
        }
        sb.append("/>");
        return sb.toString();
    }

    /**
     * <p>Return a String representation of this user.</p>
     */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("User username=\"");
        sb.append(Escape.xml(username));
        sb.append("\"");
        if (fullName != null) {
            sb.append(", fullName=\"");
            sb.append(Escape.xml(fullName));
            sb.append("\"");
        }
        List<Group> groups = getUserGroups(username);
        if (groups.size() > 0) {
            sb.append(", groups=\"");
            StringUtils.join(groups, ',', new Function<Group, String>() {
                @Override public String apply(Group t) {
                    return Escape.xml(t.getGroupname());
                }
            }, sb);
            sb.append("\"");
        }
        List<Role> roles = getUserRoles(username);
        if (roles.size() > 0) {
            sb.append(", roles=\"");
            StringUtils.join(roles, ',', new Function<Role, String>() {
                @Override public String apply(Role t) {
                    return Escape.xml(t.getRolename());
                }
            }, sb);
            sb.append("\"");
        }
        return sb.toString();
    }
}
