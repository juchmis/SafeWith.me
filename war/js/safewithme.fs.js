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
var FS = (function (crypto, server, util, cache) {
	var self = {};
	
	//
	// BucketFS json model
	//

	self.BucketFS = function(id, name, ownerEmail) {
		this.version = "1.0";
		this.id = id;
		this.name = name;
		this.ownerEmail = ownerEmail;
		this.created = new Date().toISOString();
		this.root = [];	// format the fs :)
	};
	
	self.Directory = function(name) {
		this.type = "dir";
		this.name = name;
		this.created = new Date().toISOString();
		this.children = [];
	};
	
	self.File = function(name, size, mimeType, blobKey, cryptoKey, md5) {
		this.type = "file";
		this.name = name;
		this.size = size;			// note: this is the unencrypted file size!
		this.uploaded = new Date().toISOString();
		this.mimeType = mimeType;
		this.blobKey = blobKey;		// pointer to the encrypted blob
		this.cryptoKey = cryptoKey;	// secret key required to decrypt the file
		this.md5 = md5;				// md5 hash of the encrypted file blob
	};
	
	//
	// Decrypted BucketFS caching in memory
	//
	
	var bucketCache = [];	// a cache for bucket pointer and their respectable fs

	self.cacheBucket = function(bucket, bucketFS) {
		var pair = {
			bucket : bucket,
			bucketFS : bucketFS
		};
		bucketCache.push(pair);
	};

	self.currentBucket = function() {
		// at the moment each user only has one
		return bucketCache[0].bucket;
	};

	self.currentBucketFS = function() {
		// at the moment each user only has one
		return bucketCache[0].bucketFS;
	};
	
	//
	// Bucket handling
	//
	
	/**
	 * Create a new bucket by first making a new bucket pointer on the
	 * server and then creating a bucket FS with the pointer's id.
	 * The bucket FS is then ecrypted and persited on the server in order to
	 * get a new blob-key, which is then updated on the bucket pointer.
	 */
	self.createBucket = function(name, callback) {
		server.call('POST', '/app/buckets', function(bucket) {
			// initialize bucket file system
			var bucketFS = new self.BucketFS(bucket.id, name, bucket.ownerEmail);
			persistBucketFS(bucketFS, bucket, function(updatedBucket) {
				callback(updatedBucket);
			});
		});
	};
	
	/**
	 * Get bucket pointers from server
	 */
	self.getBuckets = function(callback) {
		// TODO: read buckets from local storage
		server.call('GET', '/app/buckets', function(buckets) {
			callback(buckets);
		});
	};
	
	/**
	 * Delete a bucket from the server.
	 */
	self.removeBucket = function(bucket, callback) {
		// TODO: delete any containing file blobs
		
		// remove from local storage cache
		cache.removeObject(bucket.id);
		// delete bucket DTO in datastore
		server.call('DELETE', '/app/buckets?bucketId=' + bucket.id, function(resp) {
			callback(resp);
		});
	};
	
	//
	// BucketFS handling
	//

	/**
	 * Convert BucketFS to a JSON string, encrypt and then upload
	 */
	function persistBucketFS(bucketFS, bucket, callback, publicKey) {
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
		// cache bucket in local storage
		cache.storeObject(bucket.id);
		// upload to server
		var updatedBucketJson = JSON.stringify(bucket);
		server.upload('PUT', '/app/buckets', 'application/json', updatedBucketJson, function(updatedBucket) {
			callback(updatedBucket);
		});
	};

	/**
	 * Get bucket FS from bucket and decrypt it
	 */
	self.getBucketFS = function(encryptedFS) {
		var jsonFS =  crypto.asymmetricDecrypt(encryptedFS);
		var bucketFS = JSON.parse(jsonFS);
		
		return bucketFS;
	};

	/**
	 * Add a file to the currentyl selected bucket fs
	 */
	self.addFileToBucketFS = function(file, bucketFS, bucket, callback) {
		// at the moment directories are not yet implemented
		bucketFS.root.push(file);
		
		persistBucketFS(bucketFS, bucket, function(updatedBucket) {
			callback(updatedBucket);
		});
	};
	
	/**
	 * Delete a file from the currentyl selected bucket fs
	 */
	self.deleteFileFromBucketFS = function(fileBlobKey, bucketFS, bucket, callback) {
		// rm file from root
		for (var i = 0; i < bucketFS.root.length; i++) {
			var current = bucketFS.root[i];
			if (current.type === 'file' && current.blobKey === fileBlobKey) {
				bucketFS.root.splice(i, 1);
				break;
			}
		}
		
		persistBucketFS(bucketFS, bucket, function(updatedBucket) {
			callback(updatedBucket);
		});
	};
	
	//
	// File/Blob handling
	//
	
	/**
	 * Reads the files that have been dragged onto the page
	 * using the HTML5 FileReader Api, encrypts the file locally
	 * and upload encrypted blob to server
	 */
	self.storeFile = function(file, cachedCallback, callback) {
		// convert file/blob to binary string
		util.blob2BinStr(file, function(binStr) {
			
			// symmetrically encrypt the string
			var ct = crypto.symmetricEncrypt(binStr);
			// convert binary string to ArrayBuffer
			var ctAB = util.binStr2ArrBuf(ct.ct);
			// create blob for uploading
			var blob = util.arrBuf2Blob(ctAB, 'application/octet-stream');
			var ctMd5 = md5(ct.ct);
			
			// cache the blob locally
			cache.storeBlob(ctMd5, blob, function(success) {
				// stop displaying message
				cachedCallback();
				// upload the encrypted blob to the server
				server.uploadBlob(blob, ctMd5, function(blobKey) {
					
					// add file to bucket fs
					var fsFile = new self.File(file.name, file.size, file.type, blobKey, ct.key, ctMd5);
					var bucket = self.currentBucket();
					var bucketFS = self.currentBucketFS();
					self.addFileToBucketFS(fsFile, bucketFS, bucket, function(updatedBucket) {
						// add link to the file list
						callback(fsFile, updatedBucket);
					});
				});
			});
		});
	};
	
	/**
	 * Downloads the encrypted document and decrypt it
	 */
	self.getFile = function(file, callback) {
		// try to fetch blob from the local cache
		cache.readBlob(file.md5, function(blob) {
			if (blob) {
				handleBlob(blob);
			} else {
				// get encrypted ArrayBuffer from server
				server.downloadBlob(file.blobKey, function(blob) {
					// cache the downloaded blob
					cache.storeBlob(file.md5, blob, function(success) {
						handleBlob(blob);
					});
				});
			}
		});

		function handleBlob(blob) {
			// read blob as binary string
			util.blob2BinStr(blob, function(encrStr) {
				// symmetrically decrypt the string
				var pt = crypto.symmetricDecrypt(file.cryptoKey, encrStr);
				var ptAB = util.binStr2ArrBuf(pt);
				var blob2 = util.arrBuf2Blob(ptAB, file.mimeType);
				// return either data url or filesystem url
				util.createUrl(file.name, blob2, function(url) {
					callback(url);
				});	
			});
		}
	};
	
	/**
	 * Deletes an encrypted file blob and removes it from the bucket FS
	 */
	self.deleteFile = function(file, callback) {
		// delete from chache
		cache.removeBlob(file.md5, function(success) {
			// delete from server
			server.deleteBlob(file.blobKey, function(resp) {
				var bucket = self.currentBucket();
				var bucketFS = self.currentBucketFS();
				self.deleteFileFromBucketFS(file.blobKey, bucketFS, bucket, function() {
					callback();
				});
			});
		});
	};
	
	//
	// Filesharing
	//
	
	/**
	 * Share a file with another user
	 */
	self.shareFile = function(file, shareBucketName, shareEmail, callback, displayCallback) {
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
				// TODO: set recipient public key id on bucket
				
				persistBucketFS(shareFS, shareBucket, function(updatedShareBucket) {
					callback(updatedShareBucket);
				}, recipientKey.asciiArmored);
			});
		});
	};
	
	return self;
}(CRYPTO, SERVER, UTIL, CACHE));