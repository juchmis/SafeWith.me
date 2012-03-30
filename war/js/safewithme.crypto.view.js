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
			crypto.readKeys(loginInfo.email, keyId, callback, function() {
				// import keys from server if no matching keys are found in local storage
				self.showImportKeys(loginInfo, keyId, callback);
			});
			
		}, function(genKeysCallback) {
			
			$('#genKeysForm').submit(function(e) {
				e.preventDefault();
				// read passphrase
				var passphrase = $('#passphrase').val();
				crypto.setPassphrase(passphrase);
				// display progressbar
				var pogressbar = '<div class="progress progress-danger progress-striped active"><div class="bar" style="width: 100%;"></div></div>';
				$('#keygenStatus').html(pogressbar);
				// generate keys
				genKeysCallback();
			});

			// show disclaimer during key generation
			$('#disclaimerModal').modal('show');

		}, function() {
			// create export keys link
			crypto.exportKeys(function(url) {
				// show completion message
				var anchor = '<a style="float:right" class="btn btn-large btn-danger" download="safewithme.keys.txt" href="' + url + '">Export Keys</a>';
				var msg = '<h2 class="alert alert-success">Completed! ' + anchor + '</h2>';
				$('#keygenStatus').html(msg);
			});
		});
	};
	
	self.showImportKeys = function(loginInfo, keyId, callback) {
		$('#importKeysModal').modal('show');
		
		$('#importBtn').click(function() {
			// get passphrase
			var passphrase = $('#passphraseImport').val();
			crypto.setPassphrase(passphrase);
			
			crypto.fetchKeys(loginInfo.email, keyId, function(keys) {
				// try to read keys from local storage again
				crypto.readKeys(loginInfo.email, keyId, function() {
					window.alert('Key import from server successful!');
					$('#importKeysModal').modal('hide');
					callback();
				}, function() {
					window.alert('Key import failed... please check your passphrase!');
					return;
				});
			});
		});
	};
	
	return self;
}(window, $, CRYPTO));