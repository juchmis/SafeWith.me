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
	// Blob cache using FileSystem Apis
	//
	
	self.save = function(fileName, blob, callback) {
		initFS(function(fs) {
			
			fs.root.getFile(fileName, {create: true}, function(fileEntry) {
				// Create a FileWriter object for our FileEntry
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function(e) {
						callback();
					};
					fileWriter.onerror = function(e) { errorHandler(e); };
					fileWriter.write(blob);
				});
			}, errorHandler);
			
		}, errorHandler);
	};
	
	self.read = function(fileName, callback) {
		initFS(function(fs) {
			
			fs.root.getFile(fileName, {}, function(fileEntry) {
				fileEntry.file(function(file) {
					callback(file);
				});
			}, errorHandler);
			
		}, errorHandler);
	};
	
	self.remove = function(fileName, callback) {
		initFS(function(fs) {

			fs.root.getFile(fileName, {create: false}, function(fileEntry) {
				fileEntry.remove(function() {
					callback();
				}, errorHandler);
			}, errorHandler);

		}, errorHandler);
	};
	
	function initFS(onInitFs) {
		// check browser support
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.storageInfo = window.storageInfo || window.webkitStorageInfo;
		
		window.webkitStorageInfo.requestQuota(window.PERSISTENT, 100*1024*1024, function(grantedBytes) {
			window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, errorHandler);
		}, errorHandler);
	};
	
	function errorHandler(e) {
		console.log('Error', e);
	}
	
	return self;
}(window));