package me.safewith.model;

public interface PGPKey extends DTO {
	
	String getKeyId();
	void setKeyId(String keyId);
	String getOwnerEmail();
	void setOwnerEmail(String ownerEmail);
	String getAsciiArmored();
	void setAsciiArmored(String asciiArmored);

}
