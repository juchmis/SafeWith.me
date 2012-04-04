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

public class BucketMsg {
	
	private String id;
	private String ownerEmail;
	private String publicKeyId;
	private String encryptedFS;
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getOwnerEmail() {
		return ownerEmail;
	}
	public void setOwnerEmail(String ownerEmail) {
		this.ownerEmail = ownerEmail;
	}
	public String getPublicKeyId() {
		return publicKeyId;
	}
	public void setPublicKeyId(String publicKeyId) {
		this.publicKeyId = publicKeyId;
	}
	public String getEncryptedFS() {
		return encryptedFS;
	}
	public void setEncryptedFS(String encryptedFS) {
		this.encryptedFS = encryptedFS;
	}

}
