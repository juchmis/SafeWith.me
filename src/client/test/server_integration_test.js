module("Integration - Server");

asyncTest("XHR request", 1, function() {
	var util = new Util(window);
	var server = new Server(util);
	
	server.xhr({
		type: 'PUT',
		uri: '/login',
		expected: 200,
		success: function(resp) {
			ok(!resp.loggedIn);
			start();
		},
		error: function(e) {		
			// test failed
			start();
			return;
		}
	});
});