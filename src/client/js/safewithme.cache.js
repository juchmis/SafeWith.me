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
 * This module handles generic caching of both JSON oobjects in LocalStorage
 * as well as Blobs in the local FileSystem
 */
var Cache = function(window) {
	var self = this;
	
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
	
	/**
	 * Clears the whole local storage cache
	 */
	self.clearObjectCache = function() {
		window.localStorage.clear();
	};
	
	//
	// Blob cache using FileSystem Apis
	//
	
	/**
	 * Persist a blob locally using the FileSystem Apis (create and update)
	 * @param key [String] a unique name for the local blob (e.g. the md5 hash)
	 * @param blob [Blob] a file blob built with the BlobBuilder Api
	 * @return [boolean] if persisting was successful
	 */
	self.storeBlob = function(key, blob, callback) {
		initFS(key, {create: true}, function(fileEntry) {
			// Create a FileWriter object for our FileEntry
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.onwriteend = function(e) {
					callback(true);
				};
				fileWriter.onerror = function(e) {
					errorHandler(e);
					callback(false);
				};
				fileWriter.write(blob);
			});
		}, function(e) {
			errorHandler(e);
			callback(false);
		});
	};
	
	/**
	 * Fetches a local blob from the FileSystem Api (get)
	 * @param key [String] a unique name for the local blob (e.g. the md5 hash)
	 * @return [Blob] the read blob
	 */
	self.readBlob = function(key, callback) {
		initFS(key, {}, function(fileEntry) {
			fileEntry.file(function(file) {
				// read file successful
				callback(file);
			});
		}, function() {
			// file cannot be read
			callback(null);
		});
	};
	
	/**
	 * Removes a blob the FileSystem Apis (delete)
	 * @param key [String] a unique name for the local blob (e.g. the md5 hash)
	 * @return [boolean] if removal was successful
	 */
	self.removeBlob = function(key, callback) {
		initFS(key, {create: false}, function(fileEntry) {
			fileEntry.remove(function() {
				// deleting successful
				callback(true);
			}, errorHandler);
		}, function() {
			// file cannot be deleted
			callback(false);
		});
	};
	
	function initFS(key, options, callback, errCallback) {
		// fs handler
		function onInitFs(fs) {
			fs.root.getFile(key, options, function(fileEntry) {
				callback(fileEntry);
			}, errCallback);
		}
		// request persisten storage quota
		window.storageInfo.requestQuota(window.PERSISTENT, 1024*1024*1024 /* 1GB */, function(grantedBytes) {
			window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, errorHandler);
		}, errorHandler);
	};
	
	function errorHandler(e) {
		console.log('Error', e);
	}
	
};