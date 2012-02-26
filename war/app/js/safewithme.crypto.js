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

'use strict';

/**
 * A wrapper for encryption logic
 */
function Crypto() {
	
	var self = this;
	var privateKey;		// user's private key
	var publicKey;		// user's public key
	
	/**
	 * Initializes the crypto system by reading the user's pgp keys from localstorage
	 */
	this.init = function(userEmail) {
		// initialize OpenPGP.js
		openpgp.init();
	
		privateKey = { armored : $('#privateKeyArea').val() };
		publicKey = { armored : $('#publicKeyArea').val() };
		
		// // read keys from local storage
		// var storedPrivateKeys = openpgp.keyring.getPrivateKeyForAddress(userEmail);
		// var storedPublicKeys = openpgp.keyring.getPublicKeyForAddress(userEmail);
		// 
		// if (storedPrivateKeys.length < 1 || storedPublicKeys.length < 1) {
		// 	// generate keys
		// 	self.generateKeys(2048, userEmail);
		// 	storedPrivateKeys = openpgp.keyring.getPrivateKeyForAddress(userEmail);
		// 	storedPublicKeys = openpgp.keyring.getPublicKeyForAddress(userEmail);
		// }
		// 
		// privateKey = storedPrivateKeys[0];
		// publicKey = storedPublicKeys[0];
	};
	
	/**
	 * Generate a key pair for the user
	 * @param numBits [int] number of bits for the key creation. (should be 1024+, generally)
	 * @email [string] user's email address
	 * @return {privateKey: [openpgp_msg_privatekey], privateKeyArmored: [string], publicKeyArmored: [string]}
	 */
	this.generateKeys = function(numBits, email) {
		var userId = 'SafeWith.me User <' + email + '>';
		var keys = openpgp.generate_key_pair(1, numBits, userId); // keytype 1=RSA
		
		// store keys in html5 local storage
		openpgp.keyring.importPrivateKey(keys.privateKeyArmored, self.getPassphrase());
		openpgp.keyring.importPublicKey(keys.publicKeyArmored);
		openpgp.keyring.store();
	};
	
	/**
	 * Get the current user's public key
	 */
	this.getPublicKey = function() {
		return publicKey.armored;
	};

	/**
	 * Get the current user's private key
	 */
	this.getPrivateKey = function() {
		return privateKey.armored;
	};
	
	/**
	 * Get the user's passphrase for decrypting their private key
	 */
	this.getPassphrase = function() {
		// TODO: get passphrase in a user dialog
		return '';
	};
	
	/**
	 * Encrypt a string
	 */
	this.encrypt = function(plaintext, publicKey) {
		var pub_key = openpgp.read_publicKey(publicKey);
		var cipher = openpgp.write_encrypted_message(pub_key, plaintext);

		return cipher;
	};
	
	/**
	 * Decrypt a string
	 */
	this.decrypt = function(cipher, privateKey, password) {
		var priv_key = openpgp.read_privateKey(privateKey);
	
	    var msg = openpgp.read_message(cipher);
	    var keymat = null;
	    var sesskey = null;
	    
	    // Find the private (sub)key for the session key of the message
	    for (var i = 0; i< msg[0].sessionKeys.length; i++) {
	    	if (priv_key[0].privateKeyPacket.publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
	    		keymat = { key: priv_key[0], keymaterial: priv_key[0].privateKeyPacket};
	    		sesskey = msg[0].sessionKeys[i];
	    		break;
	    	}
	    	for (var j = 0; j < priv_key[0].subKeys.length; j++) {
	    		if (priv_key[0].subKeys[j].publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
	    			keymat = { key: priv_key[0], keymaterial: priv_key[0].subKeys[j]};
	    			sesskey = msg[0].sessionKeys[i];
	    			break;
	    		}
	    	}
	    }
	    if (keymat != null) {
	    	if (!keymat.keymaterial.decryptSecretMPIs(password)) {
	    		util.print_error("Password for secrect key was incorrect!");
	    		return null;
	    	}
	    	
	    	var decrypted = msg[0].decrypt(keymat, sesskey);
			return decrypted;
	    	
	    } else {
	    	util.print_error("No private key found!");
			return null;
	    }  
	};

}

/**
 * This function needs to be implemented, since it is used be the openpgp utils
 */
function showMessages(str) {
	//$('#debug').append(str);
}
