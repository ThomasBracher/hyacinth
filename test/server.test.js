(function() {
	'use strict';

	var assert = chai.assert;

	var Server = hyacinth.Server;

	var Request = hyacinth.Request;
	var Response = hyacinth.Response;
	var Expectation = hyacinth.Expectation;

	describe('hyacinth.server', function() {
		describe('Expectation', function() {
			it('should have at least a method and a url', function() {
				assert.throw(function() {
					new Expectation({ method: 'GET' });
				}, 'MissingArgumentError');
				assert.throw(function() {
					new Expectation({ url: '/' });
				}, 'MissingArgumentError');
				assert.doesNotThrow(function() {
					new Expectation({ method: 'GET', url: '/' });
				}, 'MissingArgumentError');
			});

			it('should handle a identical xhr', function() {
				var called = false;
				var exp = new Expectation({
					method: 'GET',
					url: '/',
					handler: function() {
						called = true;
					}
				});
				var xhr = new hyacinth.FakeXMLHttpRequest();
				xhr.open('GET', '/');
				xhr.send();

				exp.handle(xhr);
				assert.isTrue(called);
			});

			it('should respond with a Response Object as second argument', function(done) {
				var xhr = { method: 'GET', url: '/' };
				var exp = new Expectation({
					method: 'GET', url: '/',
					handler: function(req, res) {
						assert.instanceOf(res, Response);
						done();
					}
				});

				exp.handle(xhr);
			});

			it('should not handle if the method is different', function() {
				var called = false;
				var exp = new Expectation({
					method: 'GET',
					url: '/',
					handler: function() {
						called = true;
					}
				});
				var xhr = new hyacinth.FakeXMLHttpRequest();
				xhr.open('POST', '/');
				xhr.send();

				assert.isFalse(called);
			});

			it('should not handle if the url is different', function() {
				var called = false;
				var exp = new Expectation({
					method: 'GET',
					url: '/irl',
					handler: function() {
						called = true;
					}
				});
				var xhr = new hyacinth.FakeXMLHttpRequest();
				xhr.open('GET', '/url');
				xhr.send();

				exp.handle(xhr);
				assert.isFalse(called);
			});
		});

		describe('xhr faking', function() {
			var server = new Server();
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
			var server = new Server();

			it('should delete every saved requests', function() {
				server._xhrs = [ 'hello' ];
				server.shutdown();

				assert.deepEqual(server._xhrs, []);
			});
		});

		describe('detecting xhr activity', function() {
			var server;

			beforeEach(function() {
				server = new Server();
				server.launch();
			});

			afterEach(function() {
				server.shutdown();
			});

			it('should detect the xhr and save it as current xhrs', function() {
				var xhr = new XMLHttpRequest();

				assert.deepEqual(server._xhrs, [ xhr ]);
			});

			it('should add an onsend listener', function() {
				var xhr = new XMLHttpRequest();

				assert.isFunction(xhr.onsend);
			});

			it('should execute respondTo member when send event is trigger', function(done) {
				var xhr = new XMLHttpRequest();
				server.respondTo = function() {
					assert.deepEqual(xhr, arguments[0]);
					done();
				};
				xhr.open('GET', '/');
				xhr.send();
			});
		});

		describe('respondTo', function() {
			var server;

			beforeEach(function() {
				server = new Server();
				server.launch();
			});

			afterEach(function() {
				server.shutdown();
			});

			it('should execute the handler of the matching expectation', function(done) {
				server.expectations.push(new Expectation({
					method: 'GET',
					url: '/',
					handler: function() {
						done();
					}
				}));
				var xhr = {
					url: '/',
					method: 'GET'
				};

				server.respondTo(xhr);
			});

			it('should not execute if no expectation matchs the xhr', function() {
				var called = false;
				server.expectations.push(new Expectation({
					method: 'POST',
					url: '/',
					handler: function() {
						called = true;
					}
				}));
				var xhr = {
					url: '/',
					method: 'GET'
				};

				server.respondTo(xhr);
				assert.isFalse(called);
			});
		});

		describe('.get', function() {
			var server;

			beforeEach(function() {
				server = new Server();
				server.launch();
			});

			afterEach(function() {
				server.shutdown();
			});

			it('should save the expectation', function() {
				var handler = function() {};
				server.get('/', handler);

				assert.deepEqual(server.expectations[0], new Expectation({
					method: 'GET',
					url: '/',
					handler: handler
				}));
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

		describe('post', function() {
			var server;

			beforeEach(function() {
				server = new Server();
				server.launch();
			});

			afterEach(function() {
				server.shutdown();
			});

			it('should save the expectation', function() {
				var handler = function() {};
				server.post('/', 'body', handler); 

				assert.deepEqual(server.expectations[0], new Expectation({
					method: 'POST',
					url: '/',
					handler: handler
				}));
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

	describe('Request', function() {
		it('should be a constructor', function() {
			assert.isFunction(Request);
		});

		it('should throw an exception if no argument passed', function() {
			assert.throw(function() {
				new Request();
			}, 'MissingArgumentError');
		});

		it('should not throw any thing if an object is passed', function() {
			assert.doesNotThrow(function() {
				new Request({});
			});
		});

		describe('body', function() {
			it('should return the body of the xhr', function() {
				var xhr = {
					requestBody: 'hello world'
				};
				var req = new Request(xhr);

				assert.equal(req.body(), 'hello world');
			});
		});

		describe('getHeader', function() {
			it('should return the request headers of the xhr', function() {
				var xhr = {
					requestHeaders: {
						'Content-Type': 'application/json'
					}
				};
				var req = new Request(xhr);

				assert.equal(req.getHeader('Content-Type'), 'application/json');
			});

			it('should return the request headers case-insensitive', function() {
				var xhr = {
					requestHeaders: {
						'Content-Type': 'application/json'
					}
				};
				var req = new Request(xhr);

				assert.equal(req.getHeader('cOntENt-tyPe'), 'application/json');
			});
		});
	});
})();
