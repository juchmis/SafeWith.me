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
	app = express.createServer(),
	port = 8888;

app.configure(function(){
    app.use(app.router);
    app.use(express['static'](__dirname + '/client'));
});

//
// REST service mapping
//

app.get('/login', function(req, res){
	res.send(JSON.stringify({loggedIn:true}));
});

//
// init server
//

app.listen(port);

console.log(' > server started on localhost:' + port);