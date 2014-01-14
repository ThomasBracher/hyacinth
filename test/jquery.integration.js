(function() {
	'use strict';

	var assert = chai.assert;
	var Server = hyacinth.Server;
	var server;

	beforeEach(function() {
		server = new Server();
		server.launch();
	});

	afterEach(function() {
		server.shutdown();
	});

	describe('jQuery', function() {
		it('should work with a simple get', function(done) {
			server.get('/', function(req, res) {
				res.send(200, 'hello world');
			});
			$.get('/', function(data) {
				assert.equal(data, 'hello world');
				done();
			});
		});

		it('should work with a delay', function(done) {
			server.get('/', function(req, res) {
				setTimeout(function() {
					res.send(200, 'hello world');
				}, 50);
			});
			$.get('/', function(data) {
				assert.equal(data, 'hello world');
				done();
			});
		});

		it('should work with a body', function(done) {
			server.post('/', function(req, res) {
				assert.equal(req.body(), 'hello');
				res.send(200);
			});
			$.post('/', 'hello', function() {
				done();
			});
		});

		it('should return a json object when responding with json', function(done) {
			server.get('/', function(req, res) {
				res.json({ hello: 'salut' });
			});
			$.get('/', function(data) {
				assert.deepEqual(data, { hello: 'salut' });
				done();
			});
		});
	});
})();
