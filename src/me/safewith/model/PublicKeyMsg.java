package me.safewith.model;

public class PublicKeyMsg {
	
	private String keyId;
	private String ownerEmail;
	private String asciiArmored;
	
	public String getKeyId() {
		return keyId;
	}
	public void setKeyId(String keyId) {
		this.keyId = keyId;
	}
	public String getOwnerEmail() {
		return ownerEmail;
	}
	public void setOwnerEmail(String ownerEmail) {
		this.ownerEmail = ownerEmail;
	}
	public String getAsciiArmored() {
		return asciiArmored;
	}
	public void setAsciiArmored(String asciiArmored) {
		this.asciiArmored = asciiArmored;
	}

}
