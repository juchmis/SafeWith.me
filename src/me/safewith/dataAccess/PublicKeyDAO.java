/*
 * SafeWith.me - store and share your files with OpenPGP encryption on any device via HTML5
 *
 * Copyright (c) 2012 Tankred Hase
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */

package me.safewith.dataAccess;

import java.util.List;

import me.safewith.model.PublicKey;
import me.safewith.model.PGPKeyMsg;

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
	
	public static PublicKey msg2dto(PGPKeyMsg msg) {
		PublicKey pk = new PublicKey();
		
		pk.setKeyId(msg.getKeyId());
		pk.setOwnerEmail(msg.getOwnerEmail());
		pk.setAsciiArmored(msg.getAsciiArmored());
		
		return pk;		
	}
	
	public static PGPKeyMsg key2dto(PublicKey pk) {
		PGPKeyMsg msg = new PGPKeyMsg();
		
		msg.setKeyId(pk.getKeyId());
		msg.setOwnerEmail(pk.getOwnerEmail());
		msg.setAsciiArmored(pk.getAsciiArmored());
		
		return msg;
	}

}
