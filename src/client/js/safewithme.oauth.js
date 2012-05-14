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
 * A Wrapper for OAuth 2.0 authentication
 */
var OAuth = function(window) {
	var self = this;
	
	self.getLoginLink = function() {
		var clientId = '408091009440.apps.googleusercontent.com',
			redirect_uri = window.location.href,
			scope = encodeURIComponent('https://www.googleapis.com/auth/userinfo.email')
				+ '+' + encodeURIComponent('https://www.googleapis.com/auth/drive.file'),
			response_type = 'token';

		var path = '/o/oauth2/auth?client_id=' + encodeURIComponent(clientId)
			+ '&redirect_uri=' + encodeURIComponent(redirect_uri)
			+ '&scope=' + scope
			+ '&response_type=' + encodeURIComponent(response_type);
		
		return 'https://accounts.google.com' + path;
	};
	
	self.oauth2Callback = function() {
		var params = {},
			queryString = location.hash.substring(1),
			regex = /([^&=]+)=([^&]*)/g, m;
		
		if (queryString) {
			// parse oauth token from query string
			m = regex.exec(queryString);
			while (m) {
				params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
				m = regex.exec(queryString);
			}
			return params;
			
		} else {
			// no query string to parse
			return null;
		}
		
	};
	
};