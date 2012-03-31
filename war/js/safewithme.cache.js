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

var CACHE = (function (window) {
	var self = {};
	
	//
	// Object cache using LocalStorage Apis
	//
	
	/**
	 * Stringifies an object literal to JSON and perists it (create and update)
	 */
	self.storeObject = function(key, object) {
		var json = JSON.stringify(object);
		window.localStorage.setItem(key, json);
	};
	
	/**
	 * Fetches a json string from local storage by its key and parses it to an object literal (get)
	 */
	self.readObject = function(key) {
		var json = window.localStorage.getItem(key);
		return JSON.parse(json);
	};
	
	/**
	 * Removes an object liter from local storage by its key (delete)
	 */
	self.removeObject = function(key) {
		window.localStorage.removeItem(key);
	};
	
	//
	// Blob cache using FileSystem Apis
	//
	
	self.storeBlob = function(fileName, blob, callback) {
		initFS(fileName, {create: true}, function(fileEntry) {
			// Create a FileWriter object for our FileEntry
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.onwriteend = function(e) {
					callback(true);
				};
				fileWriter.onerror = function(e) { errorHandler(e); };
				fileWriter.write(blob);
			});
		}, errorHandler);
	};
	
	self.readBlob = function(fileName, callback) {
		initFS(fileName, {}, function(fileEntry) {
			fileEntry.file(function(file) {
				// read file successful
				callback(file);
			});
		}, function() {
			// file cannot be read
			callback(null);
		});
	};
	
	self.removeBlob = function(fileName, callback) {
		initFS(fileName, {create: false}, function(fileEntry) {
			fileEntry.remove(function() {
				// deleting successful
				callback(true);
			}, errorHandler);
		}, function() {
			// file cannot be deleted
			callback(false);
		});
	};
	
	function initFS(fileName, options, callback, errCallback) {
		// fs handler
		function onInitFs(fs) {
			fs.root.getFile(fileName, options, function(fileEntry) {
				callback(fileEntry);
			}, errCallback);
		}
		// request persisten storage quota
		window.storageInfo.requestQuota(window.PERSISTENT, 100*1024*1024 /* 100MB */, function(grantedBytes) {
			window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, errorHandler);
		}, errorHandler);
	};
	
	function errorHandler(e) {
		console.log('Error', e);
	}
	
	return self;
}(window));