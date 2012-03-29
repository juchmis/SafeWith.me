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
var FSVIEW = (function (window, document, $, fs) {
	var self = {};
	
	/**
	 * init UI
	 */
	self.init = function() {
		// drag and drop area
		var holder = document.getElementById('holder');
		// holder.ondragover = function () { this.className = 'hover'; return false; };
		// holder.ondragend = function () { this.className = ''; return false; };
		holder.ondragover = function () { return false; };
		holder.ondragend = function () { return false; };

		holder.ondrop = function(e) {
			// this.className = '';			
			e.preventDefault();
			var file = e.dataTransfer.files[0];
			self.handleFileDrop(file);
		};
		
		// upload button
		function handleFileSelect(e) {
			var file = e.target.files[0];
			self.handleFileDrop(file);
		}
		document.getElementById('files').addEventListener('change', handleFileSelect, false);
		
		// get user's bucket if logged in
		fs.getBuckets(function(buckets) {
			// if the user does not have any buckets create a default bucket for him
			if (buckets.length === 0) {
				fs.createBucket('Personal Documents', function(bucket) {
					self.displayBucket(bucket, 0, 1);
				});
			} else {
				for (var i = 0; i < buckets.length; i++) {
					self.displayBucket(buckets[i], i, buckets.length);
				}
			}
		});
	};

	/**
	 * Process a file after it has been droped on the droparea
	 */
	self.handleFileDrop = function(file) {
		// wait for modal to appear, then start decryption
		$('#encryptModal').on('shown', function() {
			
			// read, encrypt and upload encrypted file to server
			fs.readFile(file, function(blobKey, cryptoKey) {
				// add file to bucket fs
				var fsFile = new fs.File(file.name, file.size, file.type, blobKey, cryptoKey);
				var bucket = fs.currentBucket();
				var bucketFS = fs.currentBucketFS();

				fs.addFileToBucketFS(fsFile, bucketFS, bucket, function() {
					// hide progress bar
					$('#encryptModal').modal('hide');
					
					// display link to the file
					self.addLinkToList(fsFile);
				});
			});
			
		});
		
		// show progress bar
		$('#encryptModal').modal('show');
	};
	
	/**
	 * Display a bucket in the UI
	 */
	self.displayBucket = function(bucket, index, numBuckets) {
		// get bucket FS
		var bucketFS = fs.getBucketFS(bucket.encryptedFS);
			
		// cache local user buckets and fs
		fs.cacheBucket(bucket, bucketFS);
		
		// add bucket to accordion
		var html = '<li class="nav-header">' + bucketFS.name + '</li>';
		// var html = '<div>' +
		// 				'<h3><a href="#">' + bucketFS.name + '</a></h3>' +
		// 				'<ol id="docList"></ol>' +
		// 			'</div>';
		$('#buckets').append(html);
		
		// display file links
		for (var i=0; i < bucketFS.root.length; i++) {
			self.addLinkToList(bucketFS.root[i]);
		}
	};
	
	/**
	 * Add new documents link to the list of available documents
	 */
	self.addLinkToList = function(file) {
		var blobKey = file.blobKey;
		var item = '<li><div>' +
				   '<a id="deleteItem" href="' + blobKey + '"><i class="icon-remove icon-black"></i></a>' +
				   '<a id="showItem" href="' + blobKey + '">' + file.name + '</a>' +
				   '<a id="shareItem" href="' + blobKey + '"><i class="icon-share-alt icon-black"></i></a>' +
				   '</div></li>';
		
		$('#buckets').append(item);
		
		// show document
		$('#showItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			self.showDocItem(file);
		});
		
		// delete document
		$('#deleteItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			self.deleteDocItem(blobKey);
		});
		
		// share document
		$('#shareItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			$('#shareModal').modal('show');
		});	
			
		$('#shareForm').submit(function(e) {
			e.preventDefault();
			
			var senderEmail = $('#login a').html();
			var shareEmail = $('#shareEmail').val();
			
			if (!shareEmail || shareEmail === '') {
				alert('You must specify the recipient\'s email!');
				return false;
			}
			
			fs.shareFile(file, 'shared by ' + senderEmail , shareEmail, function(sharedBucket) {
				$('#encryptModal').modal('hide');
			}, function() {
				$('#shareModal').modal('hide');
				$('#encryptModal').modal('show');
			});

			return false;
		});

	};

	/**
	 * Downloads the encrypted document, decrypt it and display it
	 */
	self.showDocItem = function(file) {
		// wait for modal to appear, then start decryption
		$('#decryptModal').on('shown', function() {
			
			fs.getFile(file, function(decrypted) {
				// hide progress bar
				$('#decryptModal').modal('hide');
				self.displayDoc(decrypted);
			});

		});
		
		// show progress bar
		$('#decryptModal').modal('show');
		
		return false;
	};
	
	self.deleteDocItem = function(blobKey) {
		fs.deleteFile(blobKey, function() {
			var bucket = fs.currentBucket();
			var bucketFS = fs.currentBucketFS();
			fs.deleteFileFromBucketFS(blobKey, bucketFS, bucket, function() {
				$('[href="' + blobKey + '"]').remove();
			});
		});
	};

	/**
	 * Displays the document in the main view
	 */
	self.displayDoc = function(url) {
		window.location.href = url;
	};
	
	return self;
}(window, document, $, FS));