package me.safewith.dataAccess;

import java.util.List;

import me.safewith.model.PublicKey;

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

}
