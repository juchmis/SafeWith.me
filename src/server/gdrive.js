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

var https = require('https'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter;

exports.createClient = function(host, port) {
	var client = new GDriveClient(host, port);
	return client;
};

function GDriveClient(host, port) {
	this._host = host;
	this._port = port;
	
	EventEmitter.call(this);
}
util.inherits(GDriveClient, EventEmitter);

GDriveClient.prototype.downloadBlob = function(driveFile) {
	var self = this;
	
	var options = {
		host: driveFile.downloadUrl.split('.com')[0].split('://')[1] + '.com',
		port: 443,
		path: driveFile.downloadUrl.split('.com')[1],
		method: 'GET',
		auth: driveFile.oauthParams.token_type + ' ' + driveFile.oauthParams.access_token 
	};
	
	var req = https.request(options);
	
	// handle response
	req.on('response', function(res) {
		if (res.statusCode !== 200) {
			// handle error
			self.emit('error', res.statusCode, 'Invalid response from OAuth server!');
		
		} else {
			// handle ok
			res.setEncoding('utf8');

			var resBody = '';
			res.on('data', function (chunk) {
				resBody += chunk;
			});
			res.on('end', function () {
				// continue
				self.emit('data', resBody);
			});
		}
	});

	// handle errors
	req.on('error', function(err) {
		self.emit('error', 500, 'Error while sending verifying OAuth token!');
	});
	
	req.end();
};