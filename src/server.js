var express = require('express'),
	app = express.createServer(),
	port = 8080;

app.configure(function(){
    app.use(app.router);
    app.use(express['static'](__dirname + '/client'));
});

app.get('/login', function(req, res){
	res.send(JSON.stringify({loggedIn:true}));
});

app.listen(port);

console.log(' > server started on localhost:' + port);