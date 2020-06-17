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
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.apache.catalina.Group;
import org.apache.catalina.Role;
import org.apache.catalina.User;
import org.apache.catalina.UserDatabase;
import org.apache.commons.lang.RandomStringUtils;
import org.apache.ofbiz.base.util.Debug;
import org.apache.ofbiz.base.util.UtilDateTime;
import org.apache.ofbiz.base.util.UtilMisc;
import org.apache.ofbiz.base.util.UtilValidate;
import org.apache.ofbiz.entity.Delegator;
import org.apache.ofbiz.entity.DelegatorFactory;
import org.apache.ofbiz.entity.GenericEntityException;
import org.apache.ofbiz.entity.GenericValue;
import org.apache.ofbiz.entity.condition.EntityCondition;
import org.apache.ofbiz.entity.condition.EntityOperator;
import org.apache.ofbiz.entity.transaction.TransactionUtil;
import org.apache.ofbiz.entity.util.EntityQuery;
import org.apache.ofbiz.entity.util.EntityUtilProperties;
import org.apache.ofbiz.service.GenericServiceException;
import org.apache.ofbiz.service.LocalDispatcher;
import org.apache.ofbiz.service.ServiceDispatcher;
import org.apache.ofbiz.service.ServiceUtil;

/**
 * Modified from org.apache.catalina.users.MemoryUserDatabase.
 */
public class OFBizUserDatabase implements UserDatabase {

    private static final String module = OFBizUserDatabase.class.getName();
    
    private static final String resource = "DroolsUiLabels";

    /** The unique global identifier of this user database */
    protected final String delegatorName;

    /** The OFBiz database delegator */
    protected Delegator delegator;
    
    /** The OFBiz service dispatcher */
    protected LocalDispatcher dispatcher;
    
    /** The locale of messages */
    protected Locale locale = Locale.getDefault();

    /**
     * Create a new instance with default values.
     */
    public OFBizUserDatabase() {
        this(null);
    }

    /**
     * Create a new instance with the specified values.
     *
     * @param id Unique global identifier of this user database
     */
    public OFBizUserDatabase(String delegatorName) {
        this.delegatorName = delegatorName;
        this.delegator = DelegatorFactory.getDelegator(delegatorName);
        this.dispatcher = ServiceDispatcher.getLocalDispatcher("webtools", this.delegator);
    }

    /**
     * @return the set of {@link Group}s defined in this user database.
     */
    @Override
    public Iterator<Group> getGroups() {
        List<Group> groups = new ArrayList<Group>();
        try {
            List<GenericValue> groupValues = EntityQuery.use(delegator)
                                                        .from("DroolsGroupView")
                                                        .where("statusId", "PARTY_ENABLED")
                                                        .filterByDate()
                                                        .select("partyIdFrom", "groupName", "groupDescription")
                                                        .orderBy("groupName")
                                                        .cache(false)
                                                        .queryList();
            if (UtilValidate.isNotEmpty(groupValues)) {
                for (GenericValue groupValue : groupValues) {
                    Group group = new OFBizGroup(this, groupValue.getString("partyIdFrom"),
                                                       groupValue.getString("groupName"),
                                                       groupValue.getString("groupDescription"));
                    groups.add(group);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return groups.iterator();
    }

    /**
     * @return the unique global identifier of this user database.
     */
    @Override
    public String getId() {
        return (this.delegatorName);
    }

    /**
     * @return the set of {@link Role}s defined in this user database.
     */
    @Override
    public Iterator<Role> getRoles() {
    	System.out.println("--1--getRoles");
        List<Role> roles = new ArrayList<Role>();
        try {
            List<GenericValue> roleValues = EntityQuery.use(delegator)
                                                       .from("DroolsRoleView")
                                                       .filterByDate("roleFromDate", "roleThruDate")
                                                       .select("securityGroupId", "midRoleTypeId", "roleName", "roleDescription")
                                                       .orderBy("roleName")
                                                       .cache(false)
                                                       .queryList();
            if (UtilValidate.isNotEmpty(roleValues)) {
                for (GenericValue roleValue : roleValues) {
                    Role role = new OFBizRole(this, roleValue.getString("securityGroupId"),
                                                    roleValue.getString("midRoleTypeId"),
                                                    roleValue.getString("roleName"),
                                                    roleValue.getString("roleDescription"));
                    roles.add(role);
                }
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return roles.iterator();
    }
    
    /**
     * @return the set of {@link User}s defined in this user database.
     */
    @Override
    public Iterator<User> getUsers() {
        List<GenericValue> userLogins = null;
        try {
            userLogins = EntityQuery.use(delegator)
                                    .from("UserLoginAndPartyDetails")
                                    .where(EntityCondition.makeCondition("partyTypeId", EntityOperator.EQUALS, "PERSON"),
                                           EntityCondition.makeCondition(EntityOperator.OR,
                                                                         EntityCondition.makeCondition("enabled", EntityOperator.EQUALS, null),
                                                                         EntityCondition.makeCondition("enabled", EntityOperator.EQUALS, "Y")),
                                           EntityCondition.makeCondition("statusId", EntityOperator.EQUALS, "PARTY_ENABLED"))
                                    .select("userLoginId", "partyId", "firstName", "lastName")
                                    .orderBy("userLoginId")
                                    .cache(false)
                                    .queryList();
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        List<User> users = new ArrayList<User>();
        if (UtilValidate.isNotEmpty(userLogins)) {
            for (GenericValue userLogin : userLogins) {
                User user = new OFBizUser(this, userLogin.getString("userLoginId"),
                                                userLogin.getString("partyId"),
                                                "",
                                                formatUsername(userLogin.getString("firstName"), userLogin.getString("lastName")));
                users.add(user);
            }
        }
        return users.iterator();
    }

    /**
     * * @return OFBiz database {@link Delegator}.
     */
    public Delegator getDelegator() {
        return this.delegator;
    }

    // --------------------------------------------------------- Public Methods

    /**
     * Finalize access to this user database.
     *
     * @exception Exception if any exception is thrown during closing
     */
    @Override
    public void close() throws Exception {
        // do nothing
    }

    /**
     * Create and return a new {@link Group} defined in this user database.
     *
     * @param groupname The group name of the new group (must be unique)
     * @param description The description of this group
     */
    @Override
    public Group createGroup(String groupname, String description) {
        if (groupname == null || groupname.length() == 0) {
            String msg = EntityUtilProperties.getMessage(resource, "OFBizUserDatabase.nullGroup", locale, delegator);
            Debug.logWarning(msg, module);
            throw new IllegalArgumentException(msg);
        }
        
        GenericValue groupValue = findGroupValue(groupname);
        if (UtilValidate.isNotEmpty(groupValue)) {
            OFBizGroup group = new OFBizGroup(this, groupValue.getString("partyIdTo"),
                                                    groupname,
                                                    description);
            return group;
        }

        List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
        String groupPartyId = delegator.getNextSeqId("Party");
        GenericValue partyValue = delegator.makeValue("Party",
                                                      "partyId", groupPartyId,
                                                      "partyTypeId", "PARTY_GROUP",
                                                      "statusId", "PARTY_ENABLED",
                                                      "description", description);
        valuesToStore.add(partyValue);
        GenericValue partyGroupValue = delegator.makeValue("PartyGroup", 
                                                           "partyId", groupPartyId,
                                                           "groupName", groupname,
                                                           "partyGroupType", "Drools Group");
        valuesToStore.add(partyGroupValue);
        GenericValue partyRoleValue = delegator.makeValue("PartyRole",
                                                          "partyId", groupPartyId,
                                                          "roleTypeId", "_NA_");
        valuesToStore.add(partyRoleValue);
        GenericValue groupRoleValue = delegator.makeValue("PartyRelationship", 
                                                          "partyIdFrom", groupPartyId,
                                                          "partyIdTo", "DROOLS_ORGROOT",
                                                          "roleTypeIdFrom", "_NA_",
                                                          "roleTypeIdTo", "_NA_",
                                                          "fromDate", UtilDateTime.nowTimestamp());
        valuesToStore.add(groupRoleValue);
        try {
            TransactionUtil.begin();
            delegator.storeAll(valuesToStore);
            TransactionUtil.commit();
            OFBizGroup group = new OFBizGroup(this, groupPartyId, groupname, description);
            return group;
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    /**
     * Create and return a new {@link Role} defined in this user database.
     *
     * @param rolename The role name of the new group (must be unique)
     * @param description The description of this group
     */
    @Override
    public Role createRole(String rolename, String description) {
        if (rolename == null || rolename.length() == 0) {
            String msg = EntityUtilProperties.getMessage(resource, "OFBizUserDatabase.nullRole", locale, delegator);
            Debug.logWarning(msg, module);
            throw new IllegalArgumentException(msg);
        }

        GenericValue roleValue = findRoleValue(rolename);
        if (UtilValidate.isNotEmpty(roleValue)) {
            OFBizRole role = new OFBizRole(this, roleValue.getString("securityGroupId"),
                                                 roleValue.getString("midRoleTypeId"),
                                                 rolename,
                                                 description);
            return role;
        }
        return null;
    }

    /**
     * Create and return a new {@link User} defined in this user database.
     *
     * @param username The logon username of the new user (must be unique)
     * @param password The logon password of the new user
     * @param fullName The full name of the new user
     */
    @Override
    public User createUser(String username, String password, String fullName) {
        if (username == null || username.length() == 0) {
            String msg = EntityUtilProperties.getMessage(resource, "OFBizUserDatabase.nullUser", locale, delegator);
            Debug.logWarning(msg, module);
            throw new IllegalArgumentException(msg);
        }

        GenericValue userValue = findUserValue(username);
        if (UtilValidate.isNotEmpty(userValue)) {
            OFBizUser user = new OFBizUser(this, username, userValue.getString("partyId"), password, fullName);
            return user;
        }

        try {
            Map<String, Object> context = UtilMisc.toMap("userLoginId", username);
            String randomPassword = password;
            if (UtilValidate.isEmpty(password)) {
                randomPassword = RandomStringUtils.randomAlphanumeric(EntityUtilProperties.getPropertyAsInteger("security", "password.length.min", 5).intValue());
            }
            context.put("currentPassword", randomPassword);
            context.put("currentPasswordVerify", randomPassword);
            if (UtilValidate.isNotEmpty(fullName)) {
                context.put("firstName", fullName);
            }
            Map<String, Object> results = dispatcher.runSync("createPersonAndUserLogin", context);
            if (ServiceUtil.isSuccess(results)) {
                OFBizUser user = new OFBizUser(this, username, (String) results.get("partyId"), randomPassword, fullName);
                return user;
            }
        } catch (GenericServiceException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    /**
     * Return the {@link Group} with the specified group name, if any;
     * otherwise return <code>null</code>.
     *
     * @param groupname Name of the group to return
     */
    @Override
    public Group findGroup(String groupname) {
        GenericValue groupValue = findGroupValue(groupname);
        if (UtilValidate.isNotEmpty(groupValue)) {
            Group group = new OFBizGroup(this, groupValue.getString("partyIdFrom"),
                                               groupValue.getString("groupName"),
                                               groupValue.getString("groupDescription"));
            return group;
        }
        return null;
    }
    
    protected GenericValue findGroupValue(String groupname) {
        GenericValue groupValue = null;
        try {
            groupValue = EntityQuery.use(delegator)
                                    .from("DroolsGroupView")
                                    .where("groupName", groupname, "statusId", "PARTY_ENABLED")
                                    .cache(false)
                                    .filterByDate()
                                    .select("partyIdFrom", "groupName", "groupDescription")
                                    .queryFirst();
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return groupValue;
    }

    /**
     * Return the {@link Role} with the specified role name, if any;
     * otherwise return <code>null</code>.
     *
     * @param rolename Name of the role to return
     */
    @Override
    public Role findRole(String rolename) {
        GenericValue roleValue = findRoleValue(rolename);
        if (UtilValidate.isNotEmpty(roleValue)) {
            Role role = new OFBizRole(this, roleValue.getString("securityGroupId"),
                                            roleValue.getString("midRoleTypeId"),
                                            roleValue.getString("roleName"),
                                            roleValue.getString("roleDescription"));
            return role;
        }
        return null;
    }
    
    protected GenericValue findRoleValue(String rolename) {
        GenericValue roleValue = null;
        try {
            roleValue = EntityQuery.use(delegator)
                                   .from("DroolsRoleView")
                                   .where("roleName", rolename)
                                   .cache(false)
                                   .filterByDate("roleFromDate", "roleThruDate")
                                   .select("securityGroupId", "midRoleTypeId", "roleName", "roleDescription")
                                   .queryFirst();
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return roleValue;
    }

    /**
     * Return the {@link User} with the specified user name, if any;
     * otherwise return <code>null</code>.
     *
     * @param username Name of the user to return
     */
    @Override
    public OFBizUser findUser(String username) {
        GenericValue userLogin = findUserValue(username);
        if (UtilValidate.isNotEmpty(userLogin)) {
            return new OFBizUser(this, username, 
                                       userLogin.getString("partyId"),
                                       "",
                                       formatUsername(userLogin.getString("firstName"), userLogin.getString("lastName")));
        }
        return null;
    }
    
    protected GenericValue findUserValue(String username) {
        GenericValue userLogin = null;
        try {
            userLogin = EntityQuery.use(delegator)
                                   .from("UserLoginAndPartyDetails")
                                   .where(EntityCondition.makeCondition("userLoginId", username), 
                                           EntityCondition.makeCondition("partyTypeId", EntityOperator.EQUALS, "PERSON"),
                                           EntityCondition.makeCondition(EntityOperator.OR,
                                                                         EntityCondition.makeCondition("enabled", EntityOperator.EQUALS, null),
                                                                         EntityCondition.makeCondition("enabled", EntityOperator.EQUALS, "Y")),
                                           EntityCondition.makeCondition("statusId", EntityOperator.EQUALS, "PARTY_ENABLED"))
                                   .cache(false)
                                   .queryFirst();
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return userLogin;
    }

    protected static String formatUsername(String firstName, String lastName) {
        String name = "";
        if (UtilValidate.isNotEmpty(firstName)) {
            name += firstName;
        }
        if (UtilValidate.isNotEmpty(lastName)) {
            if (UtilValidate.isNotEmpty(name)) {
                name += " ";
            }
            name += lastName;
        }
        return name;
    }

    /**
     * Initialize access to this user database.
     *
     * @exception Exception if any exception is thrown during opening
     */
    @Override
    public void open() throws Exception {
        // do nothing
    }

    /**
     * Remove the specified {@link Group} from this user database.
     *
     * @param group The group to be removed
     */
    @Override
    public void removeGroup(Group group) {
        OFBizGroup ofbizGroup = (OFBizGroup) group;
        String groupPartyId = ofbizGroup.partyId;
        try {
            List<GenericValue> relationValues = EntityQuery.use(delegator)
                                                           .from("PartyRelationship")
                                                           .where("partyIdFrom", groupPartyId,
                                                                  "partyIdTo", "DROOLS_ORGROOT",
                                                                  "roleTypeIdFrom", "_NA_",
                                                                  "roleTypeIdTo", "_NA_")
                                                           .cache(false)
                                                           .filterByDate()
                                                           .queryList();
            if (UtilValidate.isNotEmpty(relationValues)) {
                List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
                Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                for (GenericValue relationValue : relationValues) {
                    relationValue.set("thruDate", nowTimestamp);
                    valuesToStore.add(relationValue);
                }
                TransactionUtil.begin();
                delegator.storeAll(valuesToStore);
                TransactionUtil.commit();
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Remove the specified {@link Role} from this user database.
     *
     * @param role The role to be removed
     */
    @Override
    public void removeRole(Role role) {
        // do nothing
    }

    /**
     * Remove the specified {@link User} from this user database.
     *
     * @param user The user to be removed
     */
    @Override
    public void removeUser(User user) {
        List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
        try {
            GenericValue userLogin = EntityQuery.use(delegator)
                                                .from("UserLogin")
                                                .where("userLoginId", user.getUsername())
                                                .cache(false)
                                                .queryOne();
            if (UtilValidate.isNotEmpty(userLogin)) {
                userLogin.set("enabled", "N");
                valuesToStore.add(userLogin);
                GenericValue party = userLogin.getRelatedOne("Party", false);
                if (UtilValidate.isNotEmpty(party)) {
                    party.set("statusId", "PARTY_DISABLED");
                    valuesToStore.add(party);
                }
            }
            if (UtilValidate.isNotEmpty(valuesToStore)) {
                delegator.storeAll(valuesToStore);
            }
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * Save any updated information to the persistent storage location for
     * this user database.
     *
     * @exception Exception if any exception is thrown during saving
     */
    @Override
    public void save() throws Exception {
        // Do nothing
    }

    /**
     * Return a String representation of this UserDatabase.
     */
    @Override
    public String toString() {
        int groupCount = 0;
        int roleCount = 0;
        int userCount = 0;
        StringBuilder sb = new StringBuilder("OFBizUserDatabase[id=");
        sb.append(this.delegatorName);
        sb.append(",groupCount=");
        sb.append(groupCount);
        sb.append(",roleCount=");
        sb.append(roleCount);
        sb.append(",userCount=");
        sb.append(userCount);
        sb.append("]");
        return (sb.toString());
    }

    public void assignRoles(String username, Collection<String> rolesToAdd, Set<String> rolesToRemove) {
        List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
        List<GenericValue> roleValuesToRemove = null;
        if (UtilValidate.isNotEmpty(rolesToRemove)) {
            try {
                roleValuesToRemove = EntityQuery.use(delegator)
                                                .from("DroolsUserRoleView")
                                                .where(EntityCondition.makeCondition("userLoginId", username),
                                                       EntityCondition.makeCondition("roleName", EntityOperator.IN, rolesToRemove))
                                                .filterByDate()
                                                .cache(false)
                                                .select("securityGroupId")
                                                .queryList();
                List<String> securityGroupIds = new ArrayList<String>();
                if (UtilValidate.isNotEmpty(roleValuesToRemove)) {
                    for (GenericValue roleValue : roleValuesToRemove) {
                        securityGroupIds.add(roleValue.getString("securityGroupId"));
                    }
                    roleValuesToRemove = EntityQuery.use(delegator)
                                                    .from("UserLoginSecurityGroup")
                                                    .where(EntityCondition.makeCondition("userLoginId", username),
                                                           EntityCondition.makeCondition("groupId", EntityOperator.IN, securityGroupIds))
                                                    .filterByDate()
                                                    .cache(false)
                                                    .queryList();
                    if (UtilValidate.isNotEmpty(roleValuesToRemove)) {
                        Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                        for (GenericValue roleValue : roleValuesToRemove) {
                            roleValue.set("thruDate", nowTimestamp);
                            valuesToStore.add(roleValue);
                        }
                    }
                }
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
        
        List<GenericValue> roleValuesToAdd = null;
        if (UtilValidate.isNotEmpty(rolesToAdd)) {
            try {
                roleValuesToAdd = EntityQuery.use(delegator)
                                             .from("DroolsRoleView")
                                             .where(EntityCondition.makeCondition("roleName", EntityOperator.IN, rolesToAdd))
                                             .filterByDate("roleFromDate", "roleThruDate")
                                             .cache(false)
                                             .select("securityGroupId")
                                             .queryList();
                if (UtilValidate.isNotEmpty(roleValuesToAdd)) {
                    Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                    for (GenericValue roleValue : roleValuesToAdd) {
                        String securityGroupId = roleValue.getString("securityGroupId");
                        GenericValue userRoleValue = delegator.create("UserLoginSecurityGroup", 
                                                                      "userLoginId", username,
                                                                      "groupId", securityGroupId,
                                                                      "fromDate", nowTimestamp);
                        valuesToStore.add(userRoleValue);
                    }
                }
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
        
        if (UtilValidate.isNotEmpty(valuesToStore)) {
            try {
                delegator.storeAll(valuesToStore);
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
    }

    public void assignGroups(String username, Set<String> groupsToAdd, Set<String> groupsToRemove) {
        List<GenericValue> valuesToStore = new ArrayList<GenericValue>();
        List<GenericValue> groupValuesToRemove = null;
        if (UtilValidate.isNotEmpty(groupsToRemove)) {
            try {
                groupValuesToRemove = EntityQuery.use(delegator)
                                                 .from("DroolsUserGroupView")
                                                 .where(EntityCondition.makeCondition("userLoginId", username),
                                                        EntityCondition.makeCondition("groupName", EntityOperator.IN, groupsToRemove))
                                                 .filterByDate("fromDate", "thruDate", "userFromDate", "userThruDate")
                                                 .cache(false)
                                                 .select("userPartyId", "partyIdFrom")
                                                 .queryList();
                List<String> partyGroupIds = new ArrayList<String>();
                if (UtilValidate.isNotEmpty(groupValuesToRemove)) {
                    String partyId = groupValuesToRemove.get(0).getString("userPartyId");
                    for (GenericValue groupValue : groupValuesToRemove) {
                        partyGroupIds.add(groupValue.getString("partyIdFrom"));
                    }
                    groupValuesToRemove = EntityQuery.use(delegator)
                                                     .from("PartyRelationship")
                                                     .where(EntityCondition.makeCondition("partyIdFrom", partyId),
                                                            EntityCondition.makeCondition("partyIdTo", EntityOperator.IN, partyGroupIds))
                                                     .filterByDate()
                                                     .cache(false)
                                                     .queryList();
                    if (UtilValidate.isNotEmpty(groupValuesToRemove)) {
                        Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                        for (GenericValue groupValue : groupValuesToRemove) {
                            groupValue.set("thruDate", nowTimestamp);
                            valuesToStore.add(groupValue);
                        }
                    }
                }
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
        
        List<GenericValue> groupValuesToAdd = null;
        if (UtilValidate.isNotEmpty(groupsToAdd)) {
            try {
                groupValuesToAdd = EntityQuery.use(delegator)
                                              .from("DroolsGroupView")
                                              .where(EntityCondition.makeCondition("groupName", EntityOperator.IN, groupsToAdd))
                                              .filterByDate()
                                              .cache(false)
                                              .select("partyIdFrom")
                                              .queryList();
                if (UtilValidate.isNotEmpty(groupValuesToAdd)) {
                    OFBizUser user = findUser(username);
                    Timestamp nowTimestamp = UtilDateTime.nowTimestamp();
                    for (GenericValue groupValue : groupValuesToAdd) {
                        String groupPartyId = groupValue.getString("partyIdFrom");
                        GenericValue groupRoleValue = delegator.create("PartyRelationship", 
                                                                       "partyIdFrom", user.partyId,
                                                                       "partyIdTo", groupPartyId,
                                                                       "roleTypeIdFrom", "_NA_",
                                                                       "roleTypeIdTo", "_NA_",
                                                                       "fromDate", nowTimestamp);
                        valuesToStore.add(groupRoleValue);
                    }
                }
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
        
        if (UtilValidate.isNotEmpty(valuesToStore)) {
            try {
                TransactionUtil.begin();
                delegator.storeAll(valuesToStore);
                TransactionUtil.commit();
            } catch (GenericEntityException e) {
                Debug.logError(e, module);
            }
        }
    }
}
