'use strict';

/**
 * This class acts as a server mock for tests
 */
var ServerDummy = function(server, respMock) {
	var self = this;
	
	//
	// Generic REST service requests
	//
	
	server.xhr = function(args) {
		args.success(respMock);
	};

	//
	// BlobStore specific service requests
	//
	
	/**
	 * Upload a file by first getting an upload url and then posting
	 * the file data to the specified uri
	 */
	self.uploadBlob = function(blob, md5, callback, errCallback) {
		this._blob = blob;
		callback('dummyBlobKey');
	};
	
	/**
	 * Download a blob from the blobstore
	 */
	self.downloadBlob = function(blobKey, callback, errCallback) {
		callback(this._blob);
	};
	
	/**
	 * Deletes a blob from the blobstore
	 */
	self.deleteBlob = server.deleteBlob;
	
};