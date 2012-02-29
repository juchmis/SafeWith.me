package me.safewith.model;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Text;

@PersistenceCapable
public class PublicKey implements DTO {
	
	/*
	 * private members
	 */
	
	@PrimaryKey
	private String keyId;

	@Persistent
	private String ownerEmail;
	
	@Persistent
	private Text asciiArmored;		// the actual PGP key
	
	/*
	 * properties
	 */

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

	public Text getAsciiArmored() {
		return asciiArmored;
	}

	public void setAsciiArmored(Text asciiArmored) {
		this.asciiArmored = asciiArmored;
	}

}
