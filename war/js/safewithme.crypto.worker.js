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

var CRYPTOWORKER = (function () {
	
	//
	// Web Worker logic
	//
	
	self.addEventListener('message', function(e) {
		// define openpgp.config for util debug
		self.openpgp = { config : {} };
		// import dependencies
		importScripts('openpgp.worker.min.js');
		
		var args = e.data,
			output = null;
			
		if (args.type === 'encrypt' && args.plaintext) {
			// start encryption
			output = self.symmetricEncrypt(args.plaintext);
			
		} else if (args.type === 'decrypt' && args.key && args.ciphertext) {
			// start decryption
			output = self.symmetricDecrypt(args.key, args.ciphertext);
		}
		
		// pass output back to main thread
		self.postMessage(output);
	}, false);
	
	//
	// Symmetric/Convergent crypto
	//
	
	/**
	 * Deterministic convergent encryption using SHA-1, SHA-256, and 256 bit AES CFB mode
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

		return { key: key, ct: ct };
	};

	/**
	 * Decrypt using symmetric 256 bit AES CFB mode
	 */
	self.symmetricDecrypt = function(key, ciphertext) {
		// decrypt using 256 bit AES (9)
		var pt = openpgp_crypto_symmetricDecrypt(9, key, ciphertext, 0);
		return pt;
	};
	
	return self;
}());