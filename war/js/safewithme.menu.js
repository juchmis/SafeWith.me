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

var MENU = (function (server, cache) {
	var self = {};
	
	/**
	 * Get login status and information from the server
	 */
	self.getLoginInfo = function(goal, callback) {
		// init Login anchor
		var uri = '/login?requestUri=' + goal;
		server.call('GET', uri, function(loginInfo) {
			// remember last user in local storage
			cache.storeObject('lastLoginInfo', loginInfo);
			// got loginInfo from server
			callback(loginInfo);
			
		}, function(jqXHR, textStatus, errorThrown) {
			// get last user if server unreachable
			var loginInfo = cache.readObject('lastLoginInfo');
			callback(loginInfo);
		});
	};
	
	return self;
}(SERVER, CACHE));