package org.pgpbox.model;

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
	private String publicKeyBlobKey;
	
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

	public String getPublicKeyBlobKey() {
		return publicKeyBlobKey;
	}

	public void setPublicKeyBlobKey(String publicKeyBlobKey) {
		this.publicKeyBlobKey = publicKeyBlobKey;
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
