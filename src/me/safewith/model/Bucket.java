package me.safewith.model;

import javax.jdo.annotations.Extension;
import javax.jdo.annotations.IdGeneratorStrategy;
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
	@Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY)
	@Extension(vendorName="datanucleus", key="gae.encoded-pk", value="true")
	private String id;

	@Persistent
	private String ownerEmail;
	
	@Persistent
	private String publicKeyId;
	
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
		if (encryptedFS != null) {
			return encryptedFS.getValue();
		} else {
			return null;
		}
	}

	public void setEncryptedFS(String encryptedFS) {
		this.encryptedFS = new Text(encryptedFS);
	}
	
}
