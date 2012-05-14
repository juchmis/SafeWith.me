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

var util = require('util'),
	EventEmitter = require('events').EventEmitter;

/**
 * Factory function for creating the module instance
 */
exports.createDAO = function() {
	var dao = new PublicKeyDAO();
	return dao;
};

function PublicKeyDAO() {
	EventEmitter.call(this);
}
util.inherits(PublicKeyDAO, EventEmitter);

/**
 * If the user has no public key yet, persist a new one,
 * otherwise update the old key 
 */
PublicKeyDAO.prototype.persist = function(publicKey) {
	var self = this;
	
	self.emit('persisted', publicKey);
};

/**
 * Get the public key by its keyId
 */
PublicKeyDAO.prototype.readById = function(keyId) {
	var self = this;
	
	self.emit('readId', {keyId:keyId});
};

/**
 * Get the public key by its owner email
 */
PublicKeyDAO.prototype.readByEmail = function(email) {
	var self = this;
	
	self.emit('readEmail', {ownerEmail:email});
};