var assert = require('assert'),
	http = require('http');

// read port and start testing
var port = process.argv[2];

initTests();

/**
 * Init testcases
 */
function initTests() {
	testGetLogin();
}

function testGetLogin() {
	restTest('GET', '/login', {},
	function(res, loginStatus, success) {
		// check response
		assert.ok(!loginStatus.loggedIn);
		assert.equal(res.statusCode, 200);
		success();

		// proceed
		testPutPublicKey();
	});
}

function testPutPublicKey() {
	restTest('PUT', '/ws/publicKeys', {
		keyId: '12345',
		ownerEmail: 'test@asdf.com',
		asciiArmored: 'ASCII_KEY'
	},
	function(res, publicKey, success) {
		// check response
		assert.equal(publicKey.keyId, '12345');
		assert.equal(res.statusCode, 200);
		success();

		// proceed
		endTestProcess();
	});
}

//
// Helper methods
//

function restTest(method, uri, bodyObject, callback) {
	console.log('\n--> ' + method + ' on ' + uri + ' test started...');

	var options = {
		method: method,
		host: '127.0.0.1',
		port: port,
		path: uri
	};

	// handle response
	var req = http.request(options, function(res) {
		resJson(res, function(resBody) {
			// check response
			callback(res, resBody, function() {
				// success
				console.log('--> ' + method + ' on ' + uri + ' test successful!');
			});
		});
	});
	
	reqJson(req, bodyObject);
}

function reqJson(req, object) {
	// create json request
	var reqBody = JSON.stringify(object);
	
	// set headers
	req.setHeader('Content-Type', 'application/json');
	req.setHeader('Content-Length', reqBody.length);
	
	req.write(reqBody, 'utf8');
	req.end();
}

function resJson(res, callback) {
	// parse json response
	res.setEncoding('utf8');

	var body = '';
	res.on('data', function(chunk) {
		body += chunk;
	});
	res.on('end', function() {			
		// check response			
		var data = JSON.parse(body);
		callback(data);
	});
}

function endTestProcess() {
	console.log('\n--> REST service integration tests successful!');
	setTimeout(function() {
		process.exit(0);
	}, 500);
}