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

'use strict';

/**
 * A wrapper for OpenPGP encryption logic
 */
var CRYPTO = (function (window, openpgp, util, server, cache) {
	var self = {};
	
	var privateKey;		// user's private key
	var publicKey;		// user's public key
	var passphrase;		// user's passphrase used for decryption

	openpgp.init();		// initialize OpenPGP.js
	
	//
	// Key management
	//
	
	/**
	 * Check if user already has a public key on the server and if not,
	 * generate a new keypait for the user
	 */
	self.initKeyPair = function(loginInfo, callback, displayCallback, finishCallback) {
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
				self.createAndPersistKeys(loginInfo.email, function(keyId) {
					callback(keyId);
					finishCallback(window.btoa(keyId));
				});
			});
		}
	};
	
	/**
	 * Generate a new key pair for the user and persist the public key on the server
	 */
	self.createAndPersistKeys = function(email, callback) {
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
		
		// first upload public key
		server.xhr({
			type: 'POST',
			uri: '/ws/publicKeys',
			contentType: 'application/json',
			expected: 201,
			body: jsonPublicKey,
			success: function(resp) {
				uploadPrivateKeys();
			},
			error: function(e) {
				// if server is not available, just continue
				// and read the user's keys from local storage
				console.log('Server unavailable: keys were not synced to server!');
				callback(keyId);
			}
		});
		
		// then upload private key
		function uploadPrivateKeys() {
			server.xhr({
				type: 'POST',
				uri: '/ws/privateKeys',
				contentType: 'application/json',
				expected: 201,
				body: jsonPrivateKey,
				success: function(resp) {
					// read the user's keys from local storage
					callback(keyId);
				}
			});
		}
	};

	/**
	 * Generate a key pair for the user
	 * @param numBits [int] number of bits for the key creation. (should be 1024+, generally)
	 * @email [string] user's email address
	 * @pass [string] a passphrase used to protect the private key
	 */
	self.generateKeys = function(numBits, email) {
		// check passphrase
		if (!passphrase && passphrase !== '') { throw 'No passphrase set!'; }
		
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
		if (!passphrase && passphrase !== '') { throw 'No passphrase set!'; }
		
		// store keys in html5 local storage
		openpgp.keyring.importPrivateKey(privateKeyArmored, passphrase);
		openpgp.keyring.importPublicKey(publicKeyArmored);
		openpgp.keyring.store();
		
		// store the passphrase in local storage
		cache.storeObject(email + 'Passphrase', { pass : passphrase });
	};

	/**
	 * Export the keys by using the HTML5 FileWriter
	 */
	self.exportKeys = function(callback) {
		// build blob
		var buf = util.binStr2ArrBuf(publicKey.armored + privateKey.armored);
		var blob = util.arrBuf2Blob(buf, 'text/plain');
		// create url
		util.createUrl(undefined, blob, callback);
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
			// no amtching keys found in the key store
			return false;
		}

		// read passphrase from local storage if no passphrase is specified
		if(!passphrase && passphrase !== '') {
			var cachedPass = cache.readObject(email + 'Passphrase');
			passphrase = cachedPass.pass;
		}
		if (!passphrase && passphrase !== '') {
			return false;
		}
		
		return true;
	};
	
	/**
	 * Get the keypair from the server and import them into localstorage
	 */
	self.fetchKeys = function(email, keyId, callback) {
		var base64Key = window.btoa(keyId);
		var encodedKeyId = encodeURIComponent(base64Key);
		
		// get public key
		server.xhr({
			type: 'GET',
			uri: '/ws/publicKeys?keyId=' + encodedKeyId,
			expected: 200,
			success: function(pubKey) {
				getPrivateKey(pubKey);
			}
		});
		
		// get private key
		function getPrivateKey(pubKey) {
			server.xhr({
				type: 'GET',
				uri: '/ws/privateKeys?keyId=' + encodedKeyId,
				expected: 200,
				success: function(privKey) {
					// import keys
					self.importKeys(pubKey.asciiArmored, privKey.asciiArmored, email);
					callback({ privateKey:privKey, publicKey:pubKey });
				}
			});
		}
	};
	
	/**
	 * Get the current user's private key
	 */
	self.getPrivateKey = function() {
		if (!privateKey) { return undefined; }
		return privateKey.armored;
	};

	/**
	 * Get the current user's public key
	 */
	self.getPublicKey = function() {
		if (!publicKey) { return undefined; }
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
	
	//
	// Asymmetric crypto
	//
	
	/**
	 * Encrypt a string
	 * @param customPubKey [PublicKey] (optional) another user's public key for sharing
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
		
		var ciphertext = openpgp.write_encrypted_message(pub_key, window.btoa(plaintext));
		return ciphertext;
	};
	
	/**
	 * Decrypt a string
	 */
	self.asymmetricDecrypt = function(ciphertext) {
		var priv_key = openpgp.read_privateKey(privateKey.armored);
	
	    var msg = openpgp.read_message(ciphertext);
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
			return window.atob(decrypted);
	    	
	    } else {
	    	throw "No private key found!";
	    }  
	};
	
	//
	// Symmetric/Convergent crypto
	//
	
	/**
	 * Deterministic convergent encryption in a web worker thread
	 */
	self.symmetricEncrypt = function(plaintext, callback) {
		// init webworker thread
		var worker = new Worker('../js/safewithme.crypto.worker.js');

		worker.addEventListener('message', function(e) {
			// return ciphertext from the worker
			callback(e.data);
		}, false);

		// send plaintext data to the worker
		worker.postMessage({type: 'encrypt', plaintext: plaintext});
	};

	/**
	 * Symmetric decryption in a web worker thread
	 */
	self.symmetricDecrypt = function(key, ciphertext, callback) {
		// init webworker thread
		var worker = new Worker('../js/safewithme.crypto.worker.js');

		worker.addEventListener('message', function(e) {
			// return plaintext from the worker
			callback(e.data);
		}, false);

		// send ciphertext and symmetric key data to the worker
		worker.postMessage({type: 'decrypt', key: key, ciphertext: ciphertext});
	};
	
	return self;
}(window, openpgp, UTIL, SERVER, CACHE));

/**
 * This function needs to be implemented, since it is used by the openpgp utils
 */
function showMessages(str) {}