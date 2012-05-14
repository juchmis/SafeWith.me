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

var express = require('express'),
	oauth = require('./server/oauth'),
	fs = require('fs'),
	prot, port, app;
	
//
// Server setup
//

// set port
if (process.argv[2]) {
	port = process.argv[2];
} else {
	port = 8888;
}

// set ssl
if (process.argv[3] === '--nossl') {
	prot = 'http';
	app = express.createServer();
} else {	
	prot = 'https';
	app = express.createServer({
		ca: fs.readFileSync('./../ssl/sub.class1.server.ca.pem'),
		key: fs.readFileSync('./../ssl/ssl.key'),
		cert: fs.readFileSync('./../ssl/ssl.crt')
	});
}

app.configure(function(){
    app.use(app.router);
    app.use(express['static'](__dirname + '/client'));
});

//
// REST service mapping
//

/**
 * Verify OAuth token and return respective login status
 */
app.get('/login', function(req, res) {
	// parse request
	reqJson(req, function(oauthParams) {
		if (oauthParams && oauthParams.access_token) {
			// verify the OAuth token
			verifyOAuthToken(oauthParams);

		} else {
			// no OAuth token... user not logged in
			sendLoginStatus({ loggedIn: false });
		}
	});
	
	function verifyOAuthToken(oauthParams) {
		var oauthClient = oauth.createClient('https://www.googleapis.com', 443);

		oauthClient.on('data', function(resBody) {
			// token is valid... user login verified
			sendLoginStatus({ loggedIn: true });
		});
		oauthClient.on('error', function(code, msg) {
			console.log(code, msg);
			respError(res, code, msg);
		});

		oauthClient.verifyToken(oauthParams.access_token);
	}
	
	function sendLoginStatus(status) {
		res.writeHead(200, {'content-type': 'application/json'});
		res.end(JSON.stringify(status));
	}
});

/**
 * Parse request JSON
 */
function reqJson(req, callback) {
	req.setEncoding('utf8');

	var body = '';
	req.on('data', function(chunk) {
		body += chunk;
	});
	req.on('end', function() {
		try {
			callback(JSON.parse(body));
		} catch (e) {
			callback(null);
		}
	});
}

/**
 * Handle error
 */
function respError(res, code, msg) {
	var error = { errMsg : msg };
	res.writeHead(code, {'content-type': 'application/json'});
	res.end(JSON.stringify(error));
}

//
// start server
//

app.listen(port);
console.log(' > listening on ' + prot + '://localhost:' + port);