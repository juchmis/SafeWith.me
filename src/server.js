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
	oauthClient = require('./server/oauth').createClient('https://www.googleapis.com', 443),
	gdriveClient = require('./server/gdrive').createClient(),
	publickeyDao = require('./server/publickey').createDAO(),
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
	app.use(express.bodyParser());
    app.use(app.router);
    app.use(express['static'](__dirname + '/client'));
});

//
// REST service mapping
//

/**
 * GET: Login status by verifying user's OAuth token
 */
app.get('/login', function(req, res) {
	// parse request
	reqJson(req, function(oauthParams) {
		if (oauthParams && oauthParams.access_token) {
			// verify the OAuth token
			verifyOAuthToken(oauthParams);

		} else {
			// no OAuth token... user not logged in
			res.send({ loggedIn: false }, 200);
		}
	});
	
	function verifyOAuthToken(oauthParams) {
		oauthClient.on('data', function(resBody) {
			// token is valid... user login verified
			res.send({ loggedIn: true }, 200);
		});
		oauthClient.on('error', function(err) {
			// error
			console.log(err.code, err.msg);
			res.send({ errMsg: err.msg }, err.code);
		});

		oauthClient.verifyToken(oauthParams.access_token);
	}
});

/**
 * PUT: Proxy Google Drive download requests since CORS requests are denied by Google 
 */
app.put('/driveFile', function(req, res) {	
	// parse request
	var driveFile = req.body;
	if (driveFile && driveFile.downloadUrl && driveFile.oauthParams) {
		// verify the OAuth token
		downloadBlob();

	} else {
		// invalid request
		res.send({ errMsg: 'Invalid request' }, 400);
	}
	
	function downloadBlob() {		
		gdriveClient.downloadBlob(driveFile, function(resBody) {
			// downloading blob successful
			res.send(resBody, {'Content-Type': 'application/octet-stream'}, 200);
			
		}, function(err) {
			// error
			console.log(err.code, err.msg);
			res.send({ errMsg: err.msg }, err.code);
		});
	}
});

/**
 * PUT: Create/Update public key
 */
app.put('/ws/publicKeys', function(req, res) {
	// parse request
	var publicKey = req.body;
	
	// persist
	publickeyDao.on('persisted', function(persisted) {
		res.send(persisted, 200);
	});
	
	publickeyDao.persist(publicKey);
});

//
// start server
//

app.listen(port);
console.log(' > listening on ' + prot + '://localhost:' + port);