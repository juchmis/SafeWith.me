module = QUnit.module;

var pubkeyDao = require('../publickey').createDAO();

module("Public Key DAO");

asyncTest("CRUD", 1, function() {
	var asciiKey = 'QWFASDFWERASDFASDF';
	
	pubkeyDao.on('persisted', function(peristed) {
		equal(peristed.asciiArmored, asciiKey, 'Persisted public key');
		start();
	});
	
	pubkeyDao.persist({
		id: '1234',
		type: 'publickey',
		asciiArmored: asciiKey
	});
});