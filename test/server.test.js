(function() {
	'use strict';

	var assert = chai.assert;

	var server = hyacinth.server;
	var Server = hyacinth.Server;

	var Response = hyacinth.Response;

	describe('hyacinth.server', function() {
		describe('xhr faking', function() {
			var XHR = window.XMLHttpRequest;

			beforeEach(function() {
				window.XMLHttpRequest = XHR;
			});

			it('should replace the current xhr object when launched', function() {
				server.launch();

				assert.deepEqual(window.XMLHttpRequest, hyacinth.FakeXMLHttpRequest);
			});

			it('should recover the xhr object when shutted down', function() {
				var xhr = window.XMLHttpRequest;
				server.launch();
				server.shutdown();

				assert.deepEqual(window.XMLHttpRequest, xhr);
			});
		});

		describe('shutdown', function() {
			it('should delete every saved requests', function() {
				server._xhrs = [ 'hello' ];
				server.shutdown();

				assert.deepEqual(server._xhrs, []);
			});
		});

		describe('detecting xhr activity', function() {
			beforeEach(function() {
				server.launch();
			});

			afterEach(function() {
				server.shutdown();
			});

			it('should detect the xhr and save it as current xhrs', function() {
				var xhr = new XMLHttpRequest();

				assert.deepEqual(server._xhrs, [ xhr ]);
			});
		});

		describe('.get', function() {
			beforeEach(function() {
				server.launch();
			});

			afterEach(function() {
				server.shutdown();
			});

			it('should execute handler when path is respected', function(done) {
				server.get('/', function() {
					done();
				});

				var xhr = new XMLHttpRequest();
				xhr.open('GET', '/');
				xhr.send();
			});
		});
	});

	describe('Response', function() {
		it('should be a constructor', function() {
			assert.isFunction(Response);
		});

		it('should throw an error if no object in the first argument', function() {
			assert.throw(function() {
				new Response();
			}, 'ArgumentMissingError');
		});

		it('should not throw an error if an object is passed', function() {
			assert.doesNotThrow(function() {
				new Response({});
			});
		});

		describe('setHeader', function() {
			it('should register the header in ._headers', function() {
				var res = new Response({});

				res.setHeader('Content-Type', 'text/html');

				assert.deepEqual(res._headers, { 'Content-Type': 'text/html' });
			});
		});

		describe('send', function() {
			it('should call xhr.respond', function(done) {
				var xhr = {
					respond: function() {
						done();
					}
				};
				var res = new Response(xhr);
				res.send();
			});

			it('should by default pass 200, {} and "" to xhr.respond', function(done) {
				var xhr = {
					respond: function() {
						assert.equal(arguments[0], 200);
						assert.deepEqual(arguments[1], {});
						assert.strictEqual(arguments[2], '');
						done();
					}
				};
				var res = new Response(xhr);
				res.send();
			});

			it('should change the status if specified', function(done) {
				var xhr = {
					respond: function() {
						assert.equal(arguments[0], 404);
						done();
					}
				};
				var res = new Response(xhr);
				res.send(404);
			});

			it('should change the text if specified', function(done) {
				var xhr = {
					respond: function() {
						assert.equal(arguments[0], 204);
						assert.equal(arguments[2], 'some text');
						done();
					}
				};
				var res = new Response(xhr);
				res.send(204, 'some text');
			});

			it('should respond 200 and text if only text specified', function(done) {
				var xhr = {
					respond: function() {
						assert.equal(arguments[0], 200);
						assert.equal(arguments[2], 'only text');
						done();
					}
				};
				var res = new Response(xhr);
				res.send('only text');
			});

			it('should pass the headers if there are some', function(done) {
				var xhr = {
					respond: function() {
						assert.deepEqual(arguments[1], { 'Content-Type': 'text/html' });
						done();
					}
				};
				var res = new Response(xhr);
				res._headers = { 'Content-Type': 'text/html' };
				res.send();
			});
		});
	});
})();
