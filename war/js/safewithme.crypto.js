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
 * A wrapper for OpenPGP encryption logic
 */
var CRYPTO = (function (window, openpgp, UTIL, SERVER) {
	var self = {};
	
	var privateKey;		// user's private key
	var publicKey;		// user's public key
	var passphrase;		// user's passphrase used for decryption

	openpgp.init();		// initialize OpenPGP.js
	
	/**
	 * Check if user already has a public key on the server and if not,
	 * generate a new keypait for the user
	 */
	self.initKeyPair = function(loginInfo, server, callback, displayCallback, finishCallback) {
		// check if user already has a key on the server
		if (loginInfo.publicKeyId) {
			// decode base 64 key ID
			var keyId = window.atob(loginInfo.publicKeyId);
			// read the user's keys from local storage
			callback(keyId);
			
		} else {
			// user has no key on the server yet
			displayCallback(function() {
				// generate new key pair
				self.createAndPersistKeys(loginInfo.email, server, function(keyId) {
					callback(keyId);
					finishCallback();
				});
			});
		}
	};
	
	/**
	 * Generate a new key pair for the user and persist the public key on the server
	 */
	self.createAndPersistKeys = function(email, server, callback) {
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
		var privateKey = {
			keyId : encodedKeyId,
			ownerEmail : email,
			asciiArmored : keys.privateKeyArmored
		};
		
		var jsonPublicKey = JSON.stringify(publicKey);
		var jsonPrivateKey = JSON.stringify(privateKey);
		
		server.upload('POST', '/app/publicKeys', 'application/json', jsonPublicKey, function(resp) {
			server.upload('POST', '/app/privateKeys', 'application/json', jsonPrivateKey, function(resp) {
				// read the user's keys from local storage
				callback(keyId);
			});
		});
	};

	/**
	 * Generate a key pair for the user
	 * @param numBits [int] number of bits for the key creation. (should be 1024+, generally)
	 * @email [string] user's email address
	 * @pass [string] a passphrase used to protect the private key
	 */
	self.generateKeys = function(numBits, email) {
		// check passphrase
		if (!passphrase) { throw 'No passphrase set!'; }
		
		var userId = 'SafeWith.me User <' + email + '>';
		var keys = openpgp.generate_key_pair(1, numBits, userId, passphrase); // keytype 1=RSA

		self.importKeys(keys.publicKeyArmored, keys.privateKeyArmored, email);

		return keys;
	};

	/**
	 * Import the users key into the HTML5 local storage
	 */
	self.importKeys = function(publicKeyArmored, privateKeyArmored, email) {
		// check passphrase
		if (!passphrase) { throw 'No passphrase set!'; }
		
		// store keys in html5 local storage
		openpgp.keyring.importPrivateKey(privateKeyArmored, passphrase);
		openpgp.keyring.importPublicKey(publicKeyArmored);
		openpgp.keyring.store();
		
		// store the passphrase in local storage
		window.localStorage.setItem(email + 'Passphrase', passphrase);
	};

	/**
	 * Export the keys by using the HTML5 FileWriter
	 */
	self.exportKeys = function(callback) {
		// Create a new Blob and write it to log.txt.
		window.BlobBuilder =  window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder;
		var bb = new BlobBuilder();

		// append public and private keys
		bb.append(publicKey.armored);
		bb.append(privateKey.armored);

		UTIL.createUrl('safewithme.keys.txt', bb.getBlob('text/plain'), callback);
	};
	
	/**
	 * Read the users keys from the browser's HTML5 local storage
	 * @email [string] user's email address
	 * @keyId [string] the public key ID in unicode (not base 64)
	 */
	self.readKeys = function(email, keyId, callback, errorCallback) {
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
			errorCallback();
			return;
		}

		// read passphrase from local storage
		passphrase = window.localStorage.getItem(email + 'Passphrase');
		if (!passphrase) {
			throw 'No passphrase for that user in localstorage!';
		}
		
		// keys found
		if (callback) { callback(); }
	};
	
	/**
	 * Get the keypair from the server and import them into localstorage
	 */
	self.fetchKeys = function(email, keyId, server, callback) {
		var base64Key = window.btoa(keyId);
		var encodedKeyId = encodeURIComponent(base64Key);
		// GET public key
		server.call('GET', '/app/publicKeys?keyId=' + encodedKeyId, function(publicKey) {
			// GET private key
			server.call('GET', '/app/privateKeys?keyId=' + encodedKeyId, function(privateKey) {
				// import keys
				self.importKeys(publicKey.asciiArmored, privateKey.asciiArmored, passphrase);
				
				callback({ privateKey:privateKey, publicKey:publicKey });
			});
		});
	};
	
	/**
	 * Get the current user's private key
	 */
	self.getPrivateKey = function() {
		return privateKey.armored;
	};

	/**
	 * Get the current user's public key
	 */
	self.getPublicKey = function() {
		return publicKey.armored;
	};

	/**
	 * Get the current user's base64 encoded public key ID
	 */
	self.getPublicKeyIdBase64 = function() {
		return window.btoa(publicKey.keyId);
	};
	
	/**
	 * Get the user's passphrase for decrypting their private key
	 */
	self.setPassphrase = function(pass) {
		passphrase = pass;
	};
	
	/**
	 * Encrypt a string
	 */
	self.asymmetricEncrypt = function(plaintext, customPubKey) {
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
	self.asymmetricDecrypt = function(cipher) {
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
	    		throw "Passphrase for secrect key was incorrect!";
	    	}
	    	
	    	var decrypted = msg[0].decrypt(keymat, sesskey);
			return decrypted;
	    	
	    } else {
	    	throw "No private key found!";
	    }  
	};
	
	/**
	 * Deterministic convergent enctryption using SHA-1, SHA-256, and 256 bit AES CFB mode
	 */
	self.symmetricEncrypt = function(data) {
		// get sha1 of data
		var sha1 = str_sha1(data);
		// generate 256 bit encryption key
		var key = str_sha256(sha1);
		// get "random" 16 octet prefix
		var prefixrandom = str_sha1(sha1).substr(0, 16);
		// encrypt using 256 bit AES (9)
		var ct = openpgp_crypto_symmetricEncrypt(prefixrandom, 9, key, data, 0);

		return { key: window.btoa(key), ct: ct };
	};

	/**
	 * Decrypt using symmetric 256 bit AES CFB mode
	 */
	self.symmetricDecrypt = function(key, ciphertext) {
		// decrypt using 256 bit AES (9)
		var pt = openpgp_crypto_symmetricDecrypt(9, window.atob(key), ciphertext, 0);
		return pt;
	};
	
	return self;
}(window, openpgp, UTIL, SERVER));

/**
 * This function needs to be implemented, since it is used by the openpgp utils
 */
function showMessages(str) {}