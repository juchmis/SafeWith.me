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

	// initialize OpenPGP.js
	openpgp.init();
	
	var self = this;
	var privateKey;		// user's private key
	var publicKey;		// user's public key
	var passphrase;		// user's passphrase used for decryption
	
	/**
	 * Check if user already has a public key on the server and if not,
	 * generate a new keypait for the user
	 */
	this.initPublicKey = function(loginInfo, server, callback, displayCallback, finishCallback) {
		// check if user already has a key on the server
		if (loginInfo.publicKeyId) {
			// decode base 64 key ID
			var keyId = window.atob(loginInfo.publicKeyId);
			// read the user's keys from local storage
			callback(keyId);
			return;
		}
		
		// user has no key on the server yet
		if(displayCallback) {
			// display message
			displayCallback();
			
			// wait a short time for the message to appear
			setTimeout(function() {
				self.createAndPersistKey(loginInfo.email, server, function(keyId) {
					callback(keyId);
					finishCallback();
				});
			}, 500);
		
		} else {
			self.createAndPersistKey(loginInfo.email, server, callback);
		}
	};
	
	/**
	 * Generate a new key pair for the user and persist the public key on the server
	 */
	this.createAndPersistKey = function(email, server, callback) {
		// generate 2048 bit RSA keys
		var keys = self.generateKeys(2048, email);
		
		// persist public key to server
		var keyId = keys.privateKey.getKeyId();
		// base64 encode key ID
		var encodedKeyId = window.btoa(keyId);
		var publicKey = {
			keyId : encodedKeyId,
			ownerEmail : email,
			asciiArmored : keys.publicKeyArmored
		};
		var json = JSON.stringify(publicKey);
		
		server.upload('POST', '/app/publicKeys', 'application/json', json, function(resp) {
			// read the user's keys from local storage
			callback(keyId);
		});
	};

	/**
	 * Generate a key pair for the user
	 * @param numBits [int] number of bits for the key creation. (should be 1024+, generally)
	 * @email [string] user's email address
	 * @pass [string] a passphrase used to protect the private key
	 */
	this.generateKeys = function(numBits, email, pass) {
		var userId = 'SafeWith.me User <' + email + '>';
		var keys = openpgp.generate_key_pair(1, numBits, userId, pass); // keytype 1=RSA

		// store keys in html5 local storage
		openpgp.keyring.importPrivateKey(keys.privateKeyArmored, pass);
		openpgp.keyring.importPublicKey(keys.publicKeyArmored);
		openpgp.keyring.store();

		return keys;
	};
	
	/**
	 * Read the users keys from the browser's HTML5 local storage
	 * @email [string] user's email address
	 * @keyId [string] the public key ID in unicode (not base 64)
	 */
	this.readKeys = function(email, keyId) {
		// read keys from local storage
		var storedPrivateKeys = openpgp.keyring.getPrivateKeyForAddress(email);
		var storedPublicKeys = openpgp.keyring.getPublicKeyForAddress(email);
		
		if (keyId) {
			// find keys by id
			for (var i=0; i < storedPrivateKeys.length; i++) {
				if (storedPrivateKeys[i].keyId === keyId) {
					privateKey = storedPrivateKeys[i];
					break;
				}
			}
			for (var j=0; j < storedPublicKeys.length; j++) {
				if (storedPublicKeys[j].keyId === keyId) {
					publicKey = storedPublicKeys[j];
					break;
				}
			}
			
		} else {
			// take first keys if no keyId is available
			privateKey = storedPrivateKeys[0];
			publicKey = storedPublicKeys[0];
		}
		
		// check keys
		if (!publicKey || !privateKey || (publicKey.keyId !== privateKey.keyId)) {
			throw "It seems as though the local keyring is missing a key!";
		}
	};
	
	/**
	 * Export the keys by using the HTML5 FileWriter
	 */
	this.exportKeys = function(callback) {
		// initial file system api
		function onInitFs(fs) {
			fs.root.getFile('safewithme.keys.txt', {create: true}, function(fileEntry) {
				
				// Create a FileWriter object for our FileEntry
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function(e) {
						var url = fileEntry.toURL();
						callback(url);
					};

					fileWriter.onerror = function(e) {
					  console.log('Write failed: ' + e.toString());
					};

					// Create a new Blob and write it to log.txt.
					window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
					var bb = new BlobBuilder();
					
					// append public and private keys
					bb.append(publicKey.armored);
					bb.append(privateKey.armored);
					fileWriter.write(bb.getBlob('text/plain'));
				});
			});
		}

		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs);
	};
	
	/**
	 * Get the current user's private key
	 */
	this.getPrivateKey = function() {
		return privateKey.armored;
	};

	/**
	 * Get the current user's public key
	 */
	this.getPublicKey = function() {
		return publicKey.armored;
	};

	/**
	 * Get the current user's base64 encoded public key ID
	 */
	this.getPublicKeyIdBase64 = function() {
		return window.btoa(publicKey.keyId);
	};
	
	/**
	 * Get the user's passphrase for decrypting their private key
	 */
	this.setPassphrase = function(pass) {
		passphrase = pass;
	};
	
	/**
	 * Encrypt a string
	 */
	this.encrypt = function(plaintext, customPubKey) {
		var pub_key = null;
		if (customPubKey) {
			// use a custom set public for e.g. or sharing
			pub_key = openpgp.read_publicKey(customPubKey);
		} else {
			// use the user's local public key
			pub_key = openpgp.read_publicKey(publicKey.armored);
		}
		
		var cipher = openpgp.write_encrypted_message(pub_key, plaintext);

		return cipher;
	};
	
	/**
	 * Decrypt a string
	 */
	this.decrypt = function(cipher) {
		var priv_key = openpgp.read_privateKey(privateKey.armored);
	
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
	    	if (!keymat.keymaterial.decryptSecretMPIs(passphrase)) {
	    		util.print_error("Passphrase for secrect key was incorrect!");
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
