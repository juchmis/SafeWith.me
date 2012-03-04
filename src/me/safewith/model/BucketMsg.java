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
