/*
 * SafeWith.me - store and share your files with OpenPGP encryption on any device via HTML5
 *
 * Copyright (c) 2012 Tankred Hase
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

package me.safewith.dataAccess;

import java.util.List;

import me.safewith.model.PGPKey;
import me.safewith.model.PGPKeyMsg;

public class PGPKeyDAO {
	
	public static <T extends PGPKey> T getKeyForUser(Class<T> cl, String email) {
		List<T> pkList = new GenericDAO().filterBy(cl, "ownerEmail", email);

		if (pkList.size() == 1) {
			return pkList.get(0); 
			
		} else if (pkList.size() > 1) {
			throw new IllegalArgumentException("It seems as though " + email + " has " + pkList.size() + " public keys stored!");
		
		} else {
			return null;
		}
	}
	
	public static <T extends PGPKey> T msg2dto(Class<T> cl, PGPKeyMsg msg) throws InstantiationException, IllegalAccessException {
		T pk = cl.newInstance();
		
		pk.setKeyId(msg.getKeyId());
		pk.setOwnerEmail(msg.getOwnerEmail());
		pk.setAsciiArmored(msg.getAsciiArmored());
		
		return pk;		
	}
	
	public static PGPKeyMsg key2dto(PGPKey pk) {
		PGPKeyMsg msg = new PGPKeyMsg();
		
		msg.setKeyId(pk.getKeyId());
		msg.setOwnerEmail(pk.getOwnerEmail());
		msg.setAsciiArmored(pk.getAsciiArmored());
		
		return msg;
	}

}
