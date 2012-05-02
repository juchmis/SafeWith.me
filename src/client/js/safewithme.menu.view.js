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
var MenuView = function($, menu, server) {
	var self = this;

	/**
	 * init UI
	 */
	self.init = function(goal, callback) {
		// show loading msg during init
		$.mobile.showPageLoadingMsg('a', 'authenticating...');
		
		menu.getLoginInfo(goal, function(loginInfo) {
			// finished init.. hide loading msg
			$.mobile.hidePageLoadingMsg();
			
			updateLoginAnchor(loginInfo);
			
			callback(loginInfo);
		});
		
		function updateLoginAnchor(loginInfo) {
			// Changes the login anchor arccording to the login status
			var anchor = $('#loginStatus');
			
			if (loginInfo.loggedIn) {
				// user is logged in
				anchor.attr({ href: 'menu.html' });
				anchor.find('span[class="ui-btn-text"]').html('Menu');
				initLoggedInUser(loginInfo);
				
			} else {
				// user is not logged in
				anchor.attr({ href: loginInfo.loginUrl });
				anchor.find('span[class="ui-btn-text"]').html('Login');
				
				// automatically trigger error handler for all REST calls if not logged in
				server.xhr = function(args) {
					args.error('Not logged in!');
				};
				
				// override jquery page change, since this causes trouble with external urls
				anchor.click(function(e) {
					e.preventDefault();
					window.location.href = loginInfo.loginUrl;
					return false;
				});
			}
		}
		
		function initLoggedInUser(loginInfo) {
			$('#menuDlg').live('pageinit', function(event) {
				// init logou button
				$('#logout-btn').click(function(e) {
					e.preventDefault();
					window.location.href = loginInfo.logoutUrl;
					return false;
				});
			});
		}
	};
	
};