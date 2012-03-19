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
function CryptoView() {

	var self = this;

	/**
	 * init UI
	 */
	this.init = function(loginInfo, server, callback) {

		// check server for user's public key ID
		self.presenter.initKeyPair(loginInfo, server, function(keyId) {
			// read corresponding keys from localstorage
			self.presenter.readKeys(loginInfo.email, keyId, callback, function() {
				// present import keys ui if no matching keys are found in local storage
				self.presenter.fetchKeys(loginInfo.email, keyId, undefined, server, function(keys) {
					// try to read keys from local storage again
					self.presenter.readKeys(loginInfo.email, keyId, function() {
						alert('Key import from server successful!');
						callback();
					}, function() {
						// error
						alert('The keys you imported do not match your public key ID on the server!');
					});
				});
				// self.showImportKeys(loginInfo, keyId, callback);
			});
			
		}, function(modalShown) {
			// wait for modal to show
			$('#disclaimerModal').on('shown', function() {
				modalShown();
			});

			// show disclaimer during key generation
			$('#disclaimerModal').modal('show');

		}, function() {
			// create export keys link
			self.presenter.exportKeys(function(url) {
				// show completion message
				var anchor = '<a style="float:right" class="btn btn-large btn-danger" download="safewithme.keys.txt" href="' + url + '">Export Keys</a>';
				var msg = '<h2 class="alert alert-success">Completed! ' + anchor + '</h2>';
				$('#keygenStatus').html(msg);
			});
		});
	};
	
	this.showImportKeys = function(loginInfo, keyId, callback) {
		$('#importKeysModal').modal('show');
		
		$('#importBtn').click(function() {
			var keyText = $('#keyTextArea').val();
			var privKeyBoarder = '-----BEGIN PGP PRIVATE KEY BLOCK-----';
			var privateKey = privKeyBoarder + keyText.split(privKeyBoarder)[1];
			var publicKey = keyText.split(privKeyBoarder)[0];
			
			var passphrase = $('#passphrase').val();
			self.presenter.importKeys(publicKey, privateKey, passphrase);
			
			// try to read the keys again after import
			self.presenter.readKeys(loginInfo.email, keyId, function() {
				// success
				$('#importKeysModal').modal('hide');
				callback();
				
			}, function() {
				// error
				alert('The keys you imported do not match your public key ID on the server!');
			});
		});
	};
}