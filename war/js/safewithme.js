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
 * Start the app on jquery mobile pageinit
 */
$('#mainPage').live('pageinit', function(event) {
	SAFEWITHME.init();
});

$('#keygen').live('pageinit', function(event) {
	SAFEWITHME.init();
});

/**
 * SafeWith.me uses the model-view-presenter (MVP) pattern to seperate 'view'
 * (DOM manipulation) logic from 'presenter' (business) logic. Dependency
 * injection is used to keep presenters decoupled and testable. The
 * 'model' is implemented using a json filesystem called 'BucketFS', which is
 * encrypted before being persisted on the server. This way the server has
 * no knowledge of file meta-data such as filenames.
 */
var SAFEWITHME = (function (window, navigator, menuView, cryptoView, fsView) {
	var self = {};
	
	/**
	 * Single point of entry for the application
	 */
	self.init = function() {		
		// check if the browser supports all necessary HTML5 Apis
		if (!checkBrowser()) { return; }

		// init views
		menuView.init('/app/', function(loginInfo) {
			// check if user is logged in
			if (!loginInfo.loggedIn || !loginInfo.email) { return; }
			// init crypto and fs
			cryptoView.init(loginInfo, function() {
				fsView.init(loginInfo);
			});
		});
	};
	
	/**
	 * Check browser support
	 */
	function checkBrowser() {
		if (!window.Worker ||
			!window.BlobBuilder ||
			!window.requestFileSystem ||
			!window.storageInfo) {
			window.alert('Sorry, your browser doesn\'t support all the necessary HTML5 features yet. Try using Chrome.');
			return false;
		}
		return true;
	}
	
	return self;
}(window, navigator, MENUVIEW, CRYPTOVIEW, FSVIEW));