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
 * A wrapper for convergent encryption logic
 */
function ConvergentCrypto() {

	// initialize OpenPGP.js
	openpgp.init();
	
	var self = this;
	
	/**
	 * Deterministic convergent enctryption using SHA-1, SHA-256, and 256 bit AES CFB mode
	 */
	this.encrypt = function(data) {
		// get sha1 of data
		var sha1 = str_sha1(data);
		// generate 256 bit encryption key
		var key = str_sha256(sha1);
		// get "random" 16 octet prefix
		var prefixrandom = str_sha1(sha1).substr(0, 16);
		// encrypt using 256 bit AES (9)
		var ct = openpgp_crypto_symmetricEncrypt(prefixrandom, 9, key, data, 0);

		return { key: btoa(key), ct: btoa(ct) };
	};

	/**
	 * Decrypt using symmetric 256 bit AES CFB mode
	 */
	this.decrypt = function(key, ciphertext) {
		// decrypt using 256 bit AES (9)
		var pt = openpgp_crypto_symmetricDecrypt(9, atob(key), atob(ciphertext), 0);
		return pt;
	};

}