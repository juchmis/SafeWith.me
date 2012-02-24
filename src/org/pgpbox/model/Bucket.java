package org.pgpbox.model;

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
	private String fsBlobUri;	// blobUri pointing to the bucket's encrypted json filesystem

	@Persistent
	private String ownerEmail;
	
	/*
	 * properties
	 */

	public String getId() {
		return id;
	}

	public String getFsBlobUri() {
		return fsBlobUri;
	}

	public void setFsBlobUri(String fsBlobUri) {
		this.fsBlobUri = fsBlobUri;
	}

	public String getOwnerEmail() {
		return ownerEmail;
	}

	public void setOwnerEmail(String ownerEmail) {
		this.ownerEmail = ownerEmail;
	}
	
}
