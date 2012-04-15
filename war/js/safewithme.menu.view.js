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
var MENUVIEW = (function ($, menu) {
	var self = {};

	/**
	 * init UI
	 */
	self.init = function(goal, callback) {
		menu.getLoginInfo(goal, function(loginInfo) {
			self.updateLogin(loginInfo);
			callback(loginInfo);
		});
	};
	
	/**
	 * Changes the login anchor archording to the login status
	 */
	self.updateLogin = function(loginInfo) {
		var anchor = $('#loginStatus');
		if (loginInfo.loggedIn) {
			anchor.attr({ href: loginInfo.logoutUrl });
			anchor.find('span[class="ui-btn-text"]').html('Logout');
		} else {
			window.location.href = loginInfo.loginUrl;
		}
		
		// override jquery page change, since this causes trouble with external urls
		anchor.click(function(e) {
			e.preventDefault();
			window.location.href = anchor.attr('href');
			return false;
		});
	};
	
	return self;
}($, MENU));