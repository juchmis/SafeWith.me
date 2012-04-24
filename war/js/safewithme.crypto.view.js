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
var CRYPTOVIEW = (function (window, $, crypto, cache) {
	var self = {};

	/**
	 * init UI
	 */
	self.init = function(loginInfo, callback) {	
		// show loading msg
		$.mobile.showPageLoadingMsg('a', 'init crypto...');

		// check server for user's public key ID
		crypto.initKeyPair(loginInfo, function(keyId) {
			// read corresponding keys from localstorage
			if (crypto.readKeys(loginInfo.email, keyId)) {
				// hide loading msg
				$.mobile.hidePageLoadingMsg();
				callback();
			} else {
				// hide loading msg
				$.mobile.hidePageLoadingMsg();
				// import keys from server if no matching keys are found in local storage
				self.showImportKeys(loginInfo, keyId, callback);
			}
			
		}, showGenKeyDlg /* displayCallback */,
		keyGenFinished /* finishCallback */ );

		function showGenKeyDlg(genKeysCallback) {
			$('#keygenDlg').live('pageinit', function(event) {
				// no keys found on server -> generate new keypair fot the user
				$('#genKeys-btn').click(function(e) {
					e.preventDefault();

					// clear localstorage (keypairs, passphrases, cached buckets)
					cache.clearObjectCache();

					// read passphrase
					var passphrase = $('#passphrase').val();
					crypto.setPassphrase(passphrase, loginInfo.email);
					// show loading msg
					$.mobile.showPageLoadingMsg('a', 'generating PGP keys...');

					// wait shortly for loading msg to appear since keygen is blocking atm
					setTimeout(function() {
						// generate keys
						genKeysCallback();
					}, 100);
				});
			});

			// hide loading msg
			$.mobile.hidePageLoadingMsg();
			$.mobile.changePage('keygen.html', {transition:'slideup'});
		}

		function keyGenFinished(keyId) {
			// store loginInfo again after clearing chache
			loginInfo.publicKeyId = keyId;
			cache.storeObject('lastLoginInfo', loginInfo);

			// create export keys link
			crypto.exportKeys(function(url) {
				// hide loading msg
				$.mobile.hidePageLoadingMsg();
				// go back to app
				$.mobile.changePage($('#mainPage'));
			});
		}
	};
	
	self.showImportKeys = function(loginInfo, keyId, callback) {
		$('#importKeysDlg').live('pageinit', function(event) {
		
			$('#import-btn').click(function() {
				// get passphrase
				var passphrase = $('#passphrase').val();
				crypto.setPassphrase(passphrase, loginInfo.email);

				// show loading msg while fetching keys
				$.mobile.showPageLoadingMsg('a', 'importing keys...');
				crypto.fetchKeys(loginInfo.email, keyId, function() {

					// try to read keys from local storage again
					if (crypto.readKeys(loginInfo.email, keyId)) {
						// go back to app
						$.mobile.changePage($('#mainPage'));
						callback();
					} else {
						window.alert('Key import failed... please check your passphrase!');
					}

					// hide loading msg
					$.mobile.hidePageLoadingMsg();
				});
			});

		});
		
		$.mobile.changePage('importkeys.html', {transition:'slideup'});
	};
	
	return self;
}(window, $, CRYPTO, CACHE));