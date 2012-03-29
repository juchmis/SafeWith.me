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
		var anchor = '';
		if (loginInfo.loggedIn) {
			anchor = 'Logout <a href="' + loginInfo.logoutUrl + '">' + loginInfo.email + '</a>';
			
		} else {
			anchor = 'Try the alpha: Login with your <a href="' + loginInfo.loginUrl + '">Google Account</a>';
		}
		
		$('#login').html(anchor);
	};
	
	return self;
}($, MENU));