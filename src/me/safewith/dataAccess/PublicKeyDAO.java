package me.safewith.dataAccess;

import java.util.List;

import me.safewith.model.PublicKey;
import me.safewith.model.PublicKeyMsg;

public class PublicKeyDAO {
	
	public static PublicKey getKeyForUser(String email) {
		List<PublicKey> pkList = new GenericDAO().filterBy(PublicKey.class, "ownerEmail", email);

		if (pkList.size() == 1) {
			return pkList.get(0); 
			
		} else if (pkList.size() > 1) {
			throw new IllegalArgumentException("It seems as though " + email + " has " + pkList.size() + " public keys stored!");
		
		} else {
			return null;
		}
	}
	
	public static PublicKey msg2dto(PublicKeyMsg msg) {
		PublicKey pk = new PublicKey();
		
		pk.setKeyId(msg.getKeyId());
		pk.setOwnerEmail(msg.getOwnerEmail());
		pk.setAsciiArmored(msg.getAsciiArmored());
		
		return pk;		
	}
	
	public static PublicKeyMsg key2dto(PublicKey pk) {
		PublicKeyMsg msg = new PublicKeyMsg();
		
		msg.setKeyId(pk.getKeyId());
		msg.setOwnerEmail(pk.getOwnerEmail());
		msg.setAsciiArmored(pk.getAsciiArmored());
		
		return msg;
	}

}
