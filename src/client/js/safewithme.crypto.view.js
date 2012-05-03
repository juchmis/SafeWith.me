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
var CryptoView = function(window, $, crypto, cache) {
	var self = this;

	/**
	 * init UI
	 */
	self.init = function(loginInfo, callback) {	
		// show loading msg
		$.mobile.showPageLoadingMsg('a', 'init crypto...');

		// check server for user's public key ID
		crypto.initKeyPair(loginInfo, function(keyId) {
			// read corresponding keys from localstorage
			if (crypto.readKeys(keyId)) {
				
				// try to sync keys to server
				crypto.syncKeysToServer(loginInfo.email, function() {
					// hide loading msg
					$.mobile.hidePageLoadingMsg();
					callback();
				});
				
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
					crypto.setPassphrase(passphrase);
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
			// remember passphrase
			crypto.rememberPassphrase(keyId);
			
			// store loginInfo again after clearing chache
			loginInfo.publicKeyId = window.btoa(keyId);
			cache.storeObject('lastLoginInfo', loginInfo);
			
			// hide loading msg
			$.mobile.hidePageLoadingMsg();
			// go back to app
			$.mobile.changePage($('#mainPage'), {transition:'turn'});
		}
	};
	
	self.showImportKeys = function(loginInfo, keyId, callback) {
		$('#importKeysDlg').live('pageinit', function(event) {
		
			$('#import-btn').click(function() {
				// get passphrase
				var passphrase = $('#passphrase').val();
				crypto.setPassphrase(passphrase);
				crypto.rememberPassphrase(keyId);

				// show loading msg while fetching keys
				$.mobile.showPageLoadingMsg('a', 'importing keys...');
				
				crypto.fetchKeys(loginInfo.email, keyId, function() {
					// keys were successfully fetched from the server
					tryReadKeysAgain();
				}, function(err) {
					// server could not be reached... check keystore anyway
					tryReadKeysAgain();
				});
				
				function tryReadKeysAgain() {
					// try to read keys from local storage again
					if (crypto.readKeys(keyId)) {
						// go back to app
						$.mobile.changePage($('#mainPage'), {transition:'turn'});
						callback();
					} else {
						window.alert('Key import failed... please check your passphrase!');
					}
					
					// hide loading msg
					$.mobile.hidePageLoadingMsg();
				}
				
			});

		});
		
		$.mobile.changePage('importkeys.html', {transition:'slidedown'});
	};
	
};