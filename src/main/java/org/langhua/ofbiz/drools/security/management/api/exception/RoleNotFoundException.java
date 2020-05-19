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

package org.langhua.ofbiz.drools.security.management.api.exception;

import org.jboss.errai.common.client.api.annotations.MapsTo;
import org.jboss.errai.common.client.api.annotations.Portable;
import org.uberfire.ext.security.management.api.exception.EntityNotFoundException;

/**
 * <p>Exception for user system management when the group is not found.</p>
 *
 */
@Portable
public class RoleNotFoundException extends EntityNotFoundException {

    private static final long serialVersionUID = 2099668189361130760L;

    public RoleNotFoundException(@MapsTo("identifier") String identifier) {
        super(identifier);
    }

    @Override
    public String getMessage() {
        return "Role [" + getIdentifier() + "] not found";
    }
}
