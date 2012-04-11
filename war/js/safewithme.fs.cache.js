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
 * This module handles caching both Buckets in local storage
 * as well as decrypted BucketFS objects in memory
 */
var BUCKETCACHE = (function (cache, server) {
	var self = {};

	//
	// Decrypted BucketFS caching in memory
	//

	var bucketFSCache = [];	// a cache for buckets and their respectable fs

	self.putFS = function(bucket, bucketFS) {
		var pair = {
			bucket : bucket,
			bucketFS : bucketFS
		};
		bucketFSCache.push(pair);
	};
	
	self.current = function() {
		if (bucketFSCache.length === 0) {
			return null;
		}
		// at the moment each user only has one
		return {
			bucket : bucketFSCache[0].bucket,
			bucketFS : bucketFSCache[0].bucketFS
		};
	};
	
	self.clearFSCache = function() {
		bucketFSCache = [];
	};
	
	//
	// Bucket (containing encrypted BucketFS) caching in LocalStorage
	//

	/**
	 * Creates/Updates a bucket in the cache with its ID as a key
	 */
	self.putBucket = function(bucket) {
		// cache bucket in local storage
		cache.storeObject(bucket.id, bucket);
		// update cached bucket ids
		var bucketIds = cache.readObject(bucket.ownerEmail + 'BucketIds');
		if (bucketIds) {
			// check if bucket id is already in the array
			var contained = false;
			for (var i = 0; i < bucketIds.length; i++) {
				if (bucketIds[i] === bucket.id) {
					contained = true;
					break;
				}
			}
			if (!contained) {
				bucketIds.push(bucket.id);
			}
		} else {
			// create new array
			bucketIds = [];
			bucketIds.push(bucket.id);
		}
		cache.storeObject(bucket.ownerEmail + 'BucketIds', bucketIds);
	};

	/**
	 * Returns all the cached buckets
	 */
	self.getAllBuckets = function(email) {
		var cachedBuckets = [];
		// get cached bucket ids
		var bucketIds = cache.readObject(email + 'BucketIds');
		if (!bucketIds) {
			return cachedBuckets;
		}
		for (var i = 0; i < bucketIds.length; i++) {
			// read bucket from local storage
			var bucket = cache.readObject(bucketIds[i]);
			cachedBuckets.push(bucket);
		}
		return cachedBuckets;
	};

	/**
	 * Remove a cache bucket from the cache
	 */
	self.removeBucket = function(bucket) {
		// remove bucket from local storage
		cache.removeObject(bucket.id);
		// update cached bucket ids
		var bucketIds = cache.readObject(bucket.ownerEmail + 'BucketIds');
		for (var i = 0; i < bucketIds.length; i++) {
			if (bucketIds[i] === bucket.id) {
				bucketIds.splice(i, 1);
				break;
			}
		}
		cache.storeObject(bucket.ownerEmail + 'BucketIds', bucketIds);
	};
	
	/**
	 * Clears the bucket cache for a ceratin user
	 */
	self.clearBucketCache = function(email) {
		// get cached bucket ids
		var bucketIds = cache.readObject(email + 'BucketIds');
		if (!bucketIds) {
			return;
		}
		
		for (var i = 0; i < bucketIds.length; i++) {
			// read bucket from local storage
			var bucket = cache.readObject(bucketIds[i]);
			self.removeBucket(bucket);
		}
	};
	
	//
	// Syncronization of BucketCache (LocalStorage) <-> Bucket DTOs (Server)
	//
	
	/**
	 * Synchronizes a single bucket between the local cache and the server.
	 * Prerequisite is that the bucket with that ID is already on both the server
	 * and in the local cache.
	 */
	self.syncSingleBucket = function(bucketId, fs, callback) {
		// read bucket from local cache
		var cachedBucket = cache.readObject(bucketId);
		
		// get bucket with the same ID from server
		fs.getBucket(bucketId, function(serverBucket) {
			compareBuckets(cachedBucket, serverBucket);
		});
		
		function compareBuckets(cachedBucket, serverBucket) {
			// check if local bucket is newer
			var cbTime = new Date(cachedBucket.lastUpdate).getTime();
			var sbTime = new Date(serverBucket.lastUpdate).getTime();
			
			// if server bucket lastUpdate is undefined, assume cached is newer
			if (!sbTime || cbTime > sbTime) {
				// if newer, send updated buckets to server
				console.log('Sync bucket(' + bucketId + '): cached -> server');
				fs.updateServerBucket(cachedBucket, function(updatedServerBucket) {
					// TODO: upload missing blobs to server
					
					callback(updatedServerBucket);
				});
				
			} else {
				// if older or equal update cached bucket
				console.log('Sync bucket(' + bucketId + '): cached <- server');
				self.putBucket(serverBucket);
				callback(serverBucket);
			}
		}
		
		function pushBlobs(bucket, callback) {
			var bucketFS = fs.getBucketFS(bucket);
			
			asyncLoop(bucketFS.root.length, function(loop) {
				// get current iterations cached bucket
				var file = bucketFS.root[loop.iteration()];
				
				// TODO: get blob from cache via md5 and upload
				
				loop.next();

			}, function(){	
				// loop is finished
				
				// TODO: update bucket fs with blobKeys
				callback();
			});
			
		}
	};

	/**
	 * Synchronize the local cached buckets with the DTO entries on the server
	 * and uploads any encrypted file-blobs, that are not yet on the server
	 * but in the local filesystem (e.g. because the user imported files offline)
	 * @return [Bucket] the synchronoized buckets that are to be displayed
	 */
	self.syncBuckets = function(email, fs, callback) {
		// fetch cached buckets
		var cachedBuckets = self.getAllBuckets(email);
		
		// try fetching buckets from server
		server.xhr({
			type: 'GET',
			uri: '/app/buckets',
			expected: 200,
			success: function(serverBuckets) {
				// start by syncing local changes to server
				syncToServer(cachedBuckets, serverBuckets);
			},
			error: function(e) {
				// no buckets from server... use cache
				callback(cachedBuckets);
			}
		});
		
		//
		// BucketCache (LocalStorage) <- Server (Buckets cannot be created without server)
		//
		
		function syncToServer(cachedBuckets, serverBuckets) {
			
			asyncLoop(serverBuckets.length, function(loop1) {
				// get current iteration os server bucket
				var sb = serverBuckets[loop1.iteration()];

				// check if server bucket is already in local cache
				var cachedLocally = false;
				
				asyncLoop(cachedBuckets.length, function(loop2) {
					// get current iterations cached bucket
					var cb = cachedBuckets[loop2.iteration()];

					if (cb.id === sb.id) {
						cachedLocally = true;
						// synchronize common bucket
						self.syncSingleBucket(cb.id, fs, function(syncedBucket) {
					        loop2.next();
						});
					} else {
						loop2.next();
					}

				}, function(){	
					// loop2 is finished for that iteration of loop1
					if (!cachedLocally) {
						// add uncached buckets from server to cache
						self.putBucket(sb);
					}	
					loop1.next();
				});
				
			}, function() {
				// loop1 is finished
				var syncedBuckets = self.getAllBuckets(email);
				callback(syncedBuckets);
			});
		}
	};
	
	
	/**
	 * An asynchronous for loop implementation
	 */
	function asyncLoop(iterations, func, callback) {
	    var index = 0;
	    var done = false;
	    var loop = {
	        next: function() {
	            if (done) {
	                return;
	            }

	            if (index < iterations) {
	                index++;
	                func(loop);

	            } else {
	                done = true;
	                callback();
	            }
	        },
	        iteration: function() {
	            return index - 1;
	        }
	    };
	    loop.next();
	    return loop;
	}
	
	return self;
}(CACHE, SERVER));