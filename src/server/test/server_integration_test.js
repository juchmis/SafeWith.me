var assert = require('assert'),
	http = require('http');

// read port and start testing
var port = process.argv[2];

initTests(port);

/**
 * Init testcases
 */
function initTests(port) {
	testGetLogin(port);
}

function testGetLogin(port) {
	console.log('\n--> GET login test started...');

	var options = {
		method: 'GET',
		host: '127.0.0.1',
		port: port,
		path: '/login'
	};

	// handle response
	var req = http.request(options, function(res) {
		resJson(res, function(loginStatus) {
			// check response
			assert.ok(!loginStatus.loggedIn);
			assert.equal(res.statusCode, 200);

			// proceed
			console.log('--> GET Login test successful!');
			testPutPublicKey(port);
		});
	});

	reqJson(req, {});
}

function testPutPublicKey(port) {
	console.log('\n--> PUT public key test started...');

	var options = {
		method: 'PUT',
		host: '127.0.0.1',
		port: port,
		path: '/ws/publicKeys'
	};

	// handle response
	var req = http.request(options, function(res) {
		resJson(res, function(publicKey) {
			// check response
			assert.equal(publicKey.keyId, '12345');
			assert.equal(res.statusCode, 200);

			// proceed
			console.log('--> PUT public key test successful!');
			endTestProcess();
		});
	});
	
	reqJson(req, {
		keyId: '12345',
		ownerEmail: 'test@asdf.com',
		asciiArmored: 'ASCII_KEY'
	});
}

//
// Helper methods
//

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