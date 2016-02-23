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
				var assertWith = function(method, object) {
					assert[method](function() {
						new Expectation(object);
					}, 'MissingArgumentError');
				};
				assertWith('throw', { method: 'GET' });
				assertWith('throw', { url: '/' });
				assertWith('doesNotThrow', { method: 'GET', url: '/' });
			});

			it('should handle with the same req and res', function() {
				var xhr = new hyacinth.FakeXMLHttpRequest();
				xhr.open('GET', '/');
        var req = new Request(xhr);
        var res = new Response(xhr);
				var exp = new Expectation({
					method: 'GET',
					url: '/',
					handler: function(request, response) {
            assert.equal(req, request);
            assert.equal(res, response);
					}
				});

				exp.handle(req, res);
			});

      it('should pass the next argument to the handler', function(done) {
        var exp = new Expectation({
          method: 'GET', url: 'super',
          handler: function(req, res, next) {
            next();
          }
        });
        exp.handle(null, null, done);
      });

			it('should not handle if the method is different', function() {
				var exp = new Expectation({
					method: 'GET',
					url: '/',
					handler: function() {}
				});

				assert.isFalse(exp.match('POST', '/'));
			});

			it('should not handle if the url is different', function() {
				var exp = new Expectation({
					method: 'GET',
					url: '/irl',
					handler: function() {}
				});

				assert.isFalse(exp.match('GET', '/super'));
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

			it('should execute lookUp member when send event is trigger', function(done) {
				var xhr = new XMLHttpRequest();
				server.lookUp = function() {
					assert.deepEqual(xhr, arguments[0]);
					done();
				};
				xhr.open('GET', '/');
				xhr.send();
			});
		});

		describe('lookUp', function() {
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

				server.lookUp(xhr);
			});

			it('should not execute if no expectation matchs the xhr', function() {
				server.expectations.push(new Expectation({
					method: 'POST',
					url: '/',
				}));
        var xhr = new hyacinth.FakeXMLHttpRequest();
        xhr.open('GET', '/');

        server.lookUp(xhr);
        assert.equal(xhr.status, 404);
        assert.equal(xhr.responseText, 'no Expectation setted for: (GET, "/")');
			});

			it('should match the actual url with a regexp', function() {
				var called = false;
				server.expectations.push(new Expectation({
					method: 'GET',
					url: /hello/,
					handler: function() { called = true; }
				}));
				var xhr = {
					url: '/hello/world',
					method: 'GET'
				};

				server.lookUp(xhr);
				assert.isTrue(called);
			});

			it('should not match if not strictly equal to a string', function() {
				server.expectations.push(new Expectation({
					method: 'GET',
					url: '/hello',
				}));
        var xhr = new hyacinth.FakeXMLHttpRequest();
        xhr.open('GET', '/hello/world');

        server.lookUp(xhr);
        assert.equal(xhr.status, 404);
			});

      it('should call the first handler to respond and not the others', function() {
        server.expectations.push(new Expectation({
          method: 'GET', url: '/',
          handler: function(req, res) { res.send(200); }
        }));
        server.expectations.push(new Expectation({
          method: 'GET', url: '/',
          handler: function(req, res) { assert.fail(); res.send(500); }
        }));
        var xhr = new hyacinth.FakeXMLHttpRequest();
        xhr.open('GET', '/');

        server.lookUp(xhr);
        assert.equal(xhr.status, 200);
      });
		});

		describe('verb', function() {
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
				server.verb('GET').call(server, '/', handler);

				assert.deepEqual(server.expectations[0], new Expectation({
					method: 'GET',
					url: '/',
					handler: handler
				}));
			});

			it('should save it when the url is not /', function() {
				var handler = function() {};
				server.verb('POST').call(server, /hello/, handler);

				assert.deepEqual(server.expectations[0], new Expectation({
					method: 'POST',
					url: /hello/,
					handler: handler
				}));
			});

			it('should be sugarize in common verbs', function() {
				assert.isFunction(server.get);
				assert.isFunction(server.post);
				assert.isFunction(server.put);
				assert.isFunction(server.delete);
				assert.isFunction(server.head);
				assert.isFunction(server.options);
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
					respond: function(status, headers) {
						assert.deepEqual(headers, { 'Content-Type': 'text/html' });
						done();
					}
				};
				var res = new Response(xhr);
				res._headers = { 'Content-Type': 'text/html' };
				res.send();
			});

      it('should set the send flag', function() {
        var xhr = {
          respond: function() {}
        };

        var res = new Response(xhr);
        assert.isFalse(res.isSend);
        res.send(200);
        assert.isTrue(res.isSend);
      });
		});

		describe('json', function() {
			it('should set the right header, text and responseType', function(done) {
				var data = { hello: 'salut' };
				var xhr = {
					respond: function(status, headers, text) {
						assert.equal(status, 200);
						assert.property(headers, 'Content-Type');
						assert.equal(headers['Content-Type'], 'application/json');
						assert.deepEqual(text, JSON.stringify(data));
						assert.equal(this.responseType, 'json');
						done();
					}
				};
				var res = new Response(xhr);

				res.json(data);
			});

			it('should override only the content-type header', function(done) {
				var xhr = {
					respond: function(status, headers) {
						assert.deepEqual(headers, {
							'Content-Type': 'application/json',
							'X-Foo': 'bar'
						});
						done();
					}
				};
				var res = new Response(xhr);

				res._headers = {
					'Content-Type': 'text/html',
					'X-Foo': 'bar'
				};
				res.json({});
			});

			it('should change the status if specified', function(done) {
				var xhr = {
					respond: function(status) {
						assert.equal(status, 204);
						done();
					}
				};
				var res = new Response(xhr);

				res.json(204, {});
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

		it('should return the requested raw url', function() {
			var xhr = {
				url: '/hello/world'
			};
			var req = new Request(xhr);

			assert.equal(req.url, '/hello/world');
		});

		describe('body', function() {
			it('should return the body of the xhr', function() {
				var xhr = {
					requestBody: 'hello world'
				};
				var req = new Request(xhr);

				assert.equal(req.body(), 'hello world');
			});

			it('should parse in json if specified', function() {
				var xhr = {
					requestBody: JSON.stringify({ hello: 'salut' })
				};
				var req = new Request(xhr);

				assert.deepEqual(req.body('json'), { hello: 'salut' });
			});

			it('should return null if the body can not be parsed', function() {
				var xhr = {
					requestBody: '{ hello: "salut" }'
				};
				var req = new Request(xhr);

				assert.strictEqual(req.body('json'), null);
			});

			it('should parse in dom if xml is specified', function() {
				var xmlContent = new DOMParser().parseFromString('<div>Hello</div>', 'text/html');
				var xhr = {
					requestBody: '<div>Hello</div>'
				};
				var req = new Request(xhr);

				assert.deepEqual(req.body('xml'), xmlContent);
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

		describe('query', function() {
			it('should be empty by default', function() {
				var req = new Request({});

				assert.deepEqual(req.query, {});
			});

			it('should be empty if no query is to find in the url', function() {
				var xhr = {
					url: '/hello?'
				};
				var req = new Request(xhr);

				assert.deepEqual(req.query, {});
			});

			it('should map the query parameters passed in the url', function() {
				var xhr = {
					url: '/hello?name=tom&color=blue'
				};
				var req = new Request(xhr);

				assert.deepEqual(req.query, {
					color: 'blue',
					name: 'tom',
				});
			});
		});
	});
})();
