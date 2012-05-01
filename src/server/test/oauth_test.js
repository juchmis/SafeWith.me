module = QUnit.module;

var oauthClient = require('../oauth').createClient('https://www.googleapis.com', 443);

module("OAuth");

asyncTest("verify access_token", 1, function() {
	oauthClient.on('data', function(resBody) {
		ok(resBody, 'OAuth verify token response');
		start();
	});
	
	oauthClient.on('error', function(err) {
		console.log('Error: ' + err);
		start();
	});
	
	oauthClient.verifyToken('asdf');
});