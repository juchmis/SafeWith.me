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

import com.google.appengine.api.datastore.Text;

@PersistenceCapable
public class Bucket implements DTO {
	
	/*
	 * private members
	 */
	
	@PrimaryKey
	private String id;
	
	@Persistent
	private String publicKeyId;
	
	@Persistent
	private String lastUpdate;
	
	@Persistent
	private Text encryptedFS;
	
	/*
	 * properties
	 */

	public String getId() {
		return id;
	}
	
	public void setId(String id) {
		if (this.id != null) {
			throw new IllegalArgumentException("The bucket's id is already set!");
		} else {
			this.id = id;
		}
	}

	public String getPublicKeyId() {
		return publicKeyId;
	}
	
	public void setPublicKeyId(String publicKeyId) {
		this.publicKeyId = publicKeyId;
	}

	public String getLastUpdate() {
		return lastUpdate;
	}

	public void setLastUpdate(String lastUpdate) {
		this.lastUpdate = lastUpdate;
	}

	public String getEncryptedFS() {
		if (encryptedFS != null) {
			return encryptedFS.getValue();
		} else {
			return null;
		}
	}

	public void setEncryptedFS(String encryptedFS) {
		if (encryptedFS != null) {
			this.encryptedFS = new Text(encryptedFS);
		}
	}
	
}
