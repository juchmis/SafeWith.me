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
		res.setEncoding('utf8');

		var body = '';
		res.on('data', function(chunk) {
			body += chunk;
		});
		res.on('end', function() {			
			// check response			
			var data = JSON.parse(body);
			assert.ok(!data.loggedIn);
			assert.equal(res.statusCode, 200);

			// proceed
			console.log('--> GET Login test successful!');
			endTestProcess();
		});
	});
	
	var reqData = {};
	var reqBody = JSON.stringify(reqData);
	
	// set headers
	req.setHeader('Content-Type', 'application/json');
	req.setHeader('Content-Length', reqBody.length);
	
	req.write(reqBody, 'utf8');
	req.end();
}

/**
 * End test process after successful completion
 */
function endTestProcess() {
	console.log('\n--> REST service integration tests successful!');
	setTimeout(function() {
		process.exit(0);
	}, 500);
}