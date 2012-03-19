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
 * This class implements all logic required for filesystem and
 * I/O between the browser's HTML5 File Apis and the application.
 */
function FS(crypto, server) {
	
	var blobServicePrefix = '/app/blobs?blob-key=';

	this.BucketFS = function(id, name, ownerEmail) {
		this.version = "1.0";
		this.id = id;
		this.name = name;
		this.ownerEmail = ownerEmail;
		this.created = new Date().toISOString();
		this.root = [];	// format the fs :)
	};
	
	this.Directory = function(name) {
		this.type = "dir";
		this.name = name;
		this.created = new Date().toISOString();
		this.children = [];
	};
	
	this.File = function(name, size, mimeType, blobKey, cryptoKey) {
		this.type = "file";
		this.name = name;
		this.size = size;			// note: this is the unencrypted file size!
		this.uploaded = new Date().toISOString();
		this.mimeType = mimeType;
		this.blobKey = blobKey;		// pointer to the encrypted blob
		this.cryptoKey = cryptoKey;	// secret key required to decrypt the file
	};

	var self = this;
	var bucketCache = [];	// a cache for bucket pointer and their respectable fs

	this.cacheBucket = function(bucket, bucketFS) {
		var pair = {
			bucket : bucket,
			bucketFS : bucketFS
		};
		bucketCache.push(pair);
	};

	this.currentBucket = function() {
		// at the moment each user only has one
		return bucketCache[0].bucket;
	};

	this.currentBucketFS = function() {
		// at the moment each user only has one
		return bucketCache[0].bucketFS;
	};
	
	/**
	 * Reads the files that have been dragged onto the page
	 * using the HTML5 FileReader Api, encrypts the file locally
	 * and upload encrypted blob to server
	 */
	this.readFile = function(file, callback) {
		var reader = new FileReader();

		reader.onload = function(event) {
			var data = event.target.result;			
			
			// encrypt file locally
			var fileCt = crypto.symmetricEncrypt(data);

			// upload the encrypted blob to the server
			server.uploadBlob(fileCt.ct, function(blobKey) {
				// add link to the file list
				callback(blobKey, fileCt.key);
			});
		};

		reader.readAsDataURL(file);
	};
	
	/**
	 * Downloads the encrypted document and decrypt it
	 */
	this.getFile = function(file, callback) {
		var uri = blobServicePrefix + file.blobKey;
		server.call('GET', uri, function(download) {
			var decrypted = crypto.symmetricDecrypt(file.cryptoKey, download);
			callback(decrypted);
		});
	};
	
	/**
	 * Deletes an encrypted file blob and removes it from the bucket FS
	 */
	this.deleteFile = function(blobKey, callback) {
		var uri = blobServicePrefix + blobKey;
		server.call('DELETE', uri, function(resp) {
			callback();
		});
	};
	
	/**
	 * Get bucket pointers from server
	 */
	this.getBuckets = function(callback) {
		server.call('GET', '/app/buckets', function(buckets) {
			callback(buckets);
		});
	};

	/**
	 * Get bucket FS from bucket and decrypt it
	 */
	this.getBucketFS = function(encryptedFS) {
		var jsonFS =  crypto.asymmetricDecrypt(encryptedFS);
		var bucketFS = JSON.parse(jsonFS);
		
		return bucketFS;
	};

	/**
	 * Add a file to the currentyl selected bucket fs
	 */
	this.addFileToBucketFS = function(file, bucketFS, bucket, callback) {
		// at the moment directories are not yet implemented
		bucketFS.root.push(file);
		
		self.persistBucketFS(bucketFS, bucket, function(updatedBucket) {
			callback(updatedBucket);
		});
	};
	

	/**
	 * Delete a file from the currentyl selected bucket fs
	 */
	this.deleteFileFromBucketFS = function(fileBlobKey, bucketFS, bucket, callback) {
		// rm file from root
		for (var i = 0; i < bucketFS.root.length; i++) {
			var current = bucketFS.root[i];
			if (current.type === 'file' && current.blobKey === fileBlobKey) {
				bucketFS.root.splice(i, 1);
				break;
			}
		}
		
		self.persistBucketFS(bucketFS, bucket, function(updatedBucket) {
			callback(updatedBucket);
		});
	};

	/**
	 * Convert BucketFS to a JSON string, encrypt and then upload
	 */
	this.persistBucketFS = function(bucketFS, bucket, callback, publicKey) {
		var jsonFS = JSON.stringify(bucketFS);
		
		var encryptedFS = null;
		if (publicKey) {
			encryptedFS = crypto.asymmetricEncrypt(jsonFS, publicKey);
		} else {
			encryptedFS = crypto.asymmetricEncrypt(jsonFS);
		}
		
		// update bucket
		bucket.encryptedFS = encryptedFS;
		bucket.publicKeyId = crypto.getPublicKeyIdBase64();
		
		var updatedBucketJson = JSON.stringify(bucket);
		server.upload('PUT', '/app/buckets', 'application/json', updatedBucketJson, function(updatedBucket) {
			callback(updatedBucket);
		});
	};
	
	/**
	 * Create a new bucket by first making a new bucket pointer on the
	 * server and then creating a bucket FS with the pointer's id.
	 * The bucket FS is then ecrypted and persited on the server in order to
	 * get a new blob-key, which is then updated on the bucket pointer.
	 */
	this.createBucket = function(name, callback) {
		server.call('POST', '/app/buckets', function(bucket) {
			
			// initialize bucket file system
			var bucketFS = new self.BucketFS(bucket.id, name, bucket.ownerEmail);
			self.persistBucketFS(bucketFS, bucket, function(updatedBucket) {
				callback(updatedBucket);
			});
		});
	};
	
	/**
	 * Delete a bucket from the server.
	 */
	this.removeBucket = function(bucket, callback) {
		// TODO: delete any containing file blobs
		
		// delete bucket DTO in datastore
		server.call('DELETE', '/app/buckets?bucketId=' + bucket.id, function(resp) {
			callback(resp);
		});
	};
	
	this.shareFile = function(file, shareBucketName, shareEmail, callback, displayCallback) {
		// get recipient's public
		server.call('GET', '/app/publicKeys?email=' + shareEmail, function(recipientKey) {
			
			// display message if recipient's public key is available
			if (recipientKey && displayCallback) {
				displayCallback();
			}
			
			// create a new bucket for the recipient
			server.call('POST', '/app/buckets', function(shareBucket) {

				// add all the encrypted files to fs
				var shareFS = new self.BucketFS(shareBucket.id, shareBucketName, shareEmail);
						
				// add file to share FS
				shareFS.root.push(file);
				
				// hand bucket ownership over to the recipient
				shareBucket.ownerEmail = shareEmail;
				
				self.persistBucketFS(shareFS, shareBucket, function(updatedShareBucket) {
					callback(updatedShareBucket);
				}, recipientKey.asciiArmored);
			});
		});
		
	};
	
}