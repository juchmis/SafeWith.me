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

package me.safewith.model;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Text;

@PersistenceCapable
public class PrivateKey implements PGPKey {
	
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

	@Override
	public String getKeyId() {
		return keyId;
	}

	@Override
	public void setKeyId(String keyId) {
		this.keyId = keyId;
	}

	@Override
	public String getOwnerEmail() {
		return ownerEmail;
	}

	@Override
	public void setOwnerEmail(String ownerEmail) {
		this.ownerEmail = ownerEmail;
	}

	@Override
	public String getAsciiArmored() {
		if (asciiArmored != null) {
			return asciiArmored.getValue();
		} else {
			return null;
		}
	}

	@Override
	public void setAsciiArmored(String asciiArmored) {
		this.asciiArmored = new Text(asciiArmored);
	}

}
