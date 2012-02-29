package me.safewith.model;

import javax.jdo.annotations.Extension;
import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

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
	private String fsBlobKey;	// blobkey pointing to the bucket's encrypted json filesystem

	@Persistent
	private String ownerEmail;
	
	@Persistent
	private String publicKeyId;
	
	/*
	 * properties
	 */

	public String getId() {
		return id;
	}

	public String getFsBlobKey() {
		return fsBlobKey;
	}

	public void setFsBlobKey(String fsBlobKey) {
		this.fsBlobKey = fsBlobKey;
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
	
}
