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

// import web worker dependencies
importScripts('lib/openpgp.worker.min.js');

var CRYPTOWORKER = (function (symEncrypt, symDecrypt, sha1, sha256) {
	
	//
	// Web Worker logic
	//
	
	/**
	 * In the web worker thread context, 'this' and 'self' can be used as a global
	 * variable namespace similar to the 'window' object in the main thread
	 */
	self.addEventListener('message', function(e) {
		// define openpgp.config locally for openpgp.util.debug in the worker thread context
		self.openpgp = { config : {} };
		
		var args = e.data,
			output = null;
			
		if (args.type === 'encrypt' && args.plaintext &&
			args.key && args.key.length === 32 && args.randomPrefix && args.randomPrefix.length === 16) {
			// start encryption
			output = self.symmetricEncrypt(args.plaintext, args.key, args.randomPrefix);
			
		} else if (args.type === 'decrypt' && args.key && args.ciphertext) {
			// start decryption
			output = self.symmetricDecrypt(args.key, args.ciphertext);
			
		} else {
			throw 'Not all arguments for web worker crypto are defined!';
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
	self.symmetricEncrypt = function(data, key, randomPrefix) {
		// encrypt using 256 bit AES (9)
		var ct = symEncrypt(randomPrefix, 9, key, data, 0);
		
		return { key: key, ct: ct };
	};

	/**
	 * Decrypt using symmetric 256 bit AES CFB mode
	 */
	self.symmetricDecrypt = function(key, ciphertext) {
		// decrypt using 256 bit AES (9)
		return symDecrypt(9, key, ciphertext, 0);
	};
	
}(openpgp_crypto_symmetricEncrypt, openpgp_crypto_symmetricDecrypt, str_sha1, str_sha256));