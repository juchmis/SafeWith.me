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
 * This class contains all logic that makes changes to the DOM
 */
var CRYPTOVIEW = (function (window, $, crypto) {
	var self = {};

	/**
	 * init UI
	 */
	self.init = function(loginInfo, callback) {

		// check server for user's public key ID
		crypto.initKeyPair(loginInfo, function(keyId) {
			// read corresponding keys from localstorage
			if (crypto.readKeys(loginInfo.email, keyId)) {
				callback();
			} else {
				// import keys from server if no matching keys are found in local storage
				self.showImportKeys(loginInfo, keyId, callback);
			}
			
		}, function(genKeysCallback) /* displayCallback */ {
			
			// no keys found on server -> generate new keypair fot the user
			$('#genKeys-btn').click(function(e) {
				e.preventDefault();
				// clear localstorage (keypairs, passphrases, cached buckets)
				window.localStorage.clear();
				// read passphrase
				var passphrase = $('#passphrase').val();
				crypto.setPassphrase(passphrase);
				// display progressbar
				$.mobile.showPageLoadingMsg();
				// generate keys
				genKeysCallback();
			});

			$.mobile.changePage('keygen.html', {transition:'slidedown'});

		}, function() /* finishCallback */ {
			
			// create export keys link
			crypto.exportKeys(function(url) {
				// show completion message
				$.mobile.hidePageLoadingMsg();
				// go back to app
				$.mobile.changePage('index.html');
			});
		});
	};
	
	self.showImportKeys = function(loginInfo, keyId, callback) {
		$.mobile.changePage('importkeys.html', {transition:'slideup'});
		
		$('#import-btn').click(function() {
			// get passphrase
			var passphrase = $('#passphrase').val();
			crypto.setPassphrase(passphrase);
			$.mobile.showPageLoadingMsg();
			
			crypto.fetchKeys(loginInfo.email, keyId, function(keys) {
				$.mobile.hidePageLoadingMsg();
				// try to read keys from local storage again
				if (crypto.readKeys(loginInfo.email, keyId)) {
					window.alert('Key import from server successful!');
					// go back to app
					$.mobile.changePage('index.html');
					callback();
				} else {
					window.alert('Key import failed... please check your passphrase!');
					return;
				}
			});
		});
	};
	
	return self;
}(window, $, CRYPTO));