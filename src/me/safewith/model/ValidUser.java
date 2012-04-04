/*
 * SafeWith.me - store and share your files with OpenPGP encryption on any device via HTML5
 *
 * Copyright (c) 2012 Tankred Hase
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

package me.safewith.model;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

@PersistenceCapable
public class ValidUser implements DTO {
	
	/*
	 * private members
	 */

	@PrimaryKey
	private String email;
	
	@Persistent
	private long usedStorage;
	
	@Persistent
	private long allowedStorage;	// the user's allowed quota
	
	/*
	 * properties
	 */

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public long getUsedStorage() {
		return usedStorage;
	}
	
	public void updateUsedStorage(long delta) {
		this.usedStorage += delta;
	}

	public long getAllowedStorage() {
		return allowedStorage;
	}

	public void setAllowedStorage(long allowedStorage) {
		this.allowedStorage = allowedStorage;
	}

}
