(function() {
	'use strict';

	var assert = chai.assert;

	describe('fakeXMLHttpRequest', function() {
		var Request = hyacinth.FakeXMLHttpRequest;

		it('should be a constructor', function() {
			assert.isFunction(Request);
			assert.equal(Request.prototype.constructor, Request);
		});

		it('should implements readyState constants', function() {
			assert.equal(Request.OPENED, 1);
			assert.equal(Request.HEADERS_RECEIVED, 2);
			assert.equal(Request.LOADING, 3);
			assert.equal(Request.DONE, 4);
		});

		it('should call on create and pass the object', function() {
			var fake;
			Request.oncreate = function(xhr) {
				fake = xhr;
			};
			var req = new Request();
			assert.equal(req, fake);
		});

		describe('open', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
			});

			it('should be a method', function() {
				assert.isFunction(xhr.open);
			});

			it('should set properties on object', function() {
				xhr.open('GET', 'my/url', true, 'user', 'pass');

				assert.equal(xhr.method, 'GET');
				assert.equal(xhr.url, 'my/url');
				assert.isTrue(xhr.async);
				assert.equal(xhr.user, 'user');
				assert.equal(xhr.password, 'pass');
			});

			it('should be async by default', function() {
				xhr.open('GET', 'my/url');

				assert.isTrue(xhr.async);
			});

			it('should set async to false', function() {
				xhr.open('GET', 'url', false);

				assert.isFalse(xhr.async);
			});

			it('should set responseText to null', function() {
				xhr.open('GET', 'url');

				assert.isNull(xhr.responseText);
			});

			it('should set requestHeaders to a blank object', function() {
				xhr.open('GET', 'url');

				assert.isObject(xhr.requestHeaders);
				assert.deepEqual(xhr.requestHeaders, {});
			});

			it('should set readystate to OPENED', function() {
				xhr.open('GET', 'url');

				assert.equal(xhr.readyState, Request.OPENED);
			});

			it('should set send flag to false', function() {
				xhr.open('GET', 'url');

				assert.isFalse(xhr.sendFlag);
			});

			it('should call onreadystatechange handler before headers after the rest', function(done) {
				xhr.onreadystatechange = function() {
					assert.equal(this, xhr);
					assert.equal(this.method, 'GET');
					assert.equal(this.url, 'url');
					assert.isTrue(this.async);
					assert.isUndefined(this.user);
					assert.isUndefined(this.password);
					assert.isNull(this.responseText);
					assert.isUndefined(this.requestHeaders);
					assert.equal(this.readyState, Request.OPENED);
					assert.isFalse(this.sendFlag);
					done();
				};
				xhr.open('GET', 'url');
			});
		});

		describe('setRequestHeader', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
				xhr.open('GET', '/');
			});

			it('should throw an exception if readyState is not OPENED', function() {
				var xhr = new Request();
				assert.throw(function() {
					xhr.setRequestHeader();
				});
			});

			it('should throw an exception if send flag is true', function() {
				xhr.sendFlag = true;

				assert.throw(function() {
					xhr.setRequestHeader();
				});
			});

			it('should disallow unsafe headers', function() {
				var throwHeader = function(header) {
					assert.throw(function() {
						xhr.setRequestHeader(header, '');
					}, Error, header, header);
				};

				throwHeader('Accept-Charset');
				throwHeader('Accept-Encoding');
				throwHeader('Connection');
				throwHeader('Content-Length');
				throwHeader('Cookie');
				throwHeader('Cookie2');
				throwHeader('Content-Transfer-Encoding');
				throwHeader('Date');
				throwHeader('Expect');
				throwHeader('Host');
				throwHeader('Keep-Alive');
				throwHeader('Referer');
				throwHeader('TE');
				throwHeader('Transfer-Encoding');
				throwHeader('Upgrade');
				throwHeader('User-Agent');
				throwHeader('Via');
				throwHeader('Proxy-Oops');
				throwHeader('Sec-Oops');
			});

			it('should set header and value', function() {
				xhr.setRequestHeader('X-Fake', 'Yeah');

				assert.deepEqual(xhr.requestHeaders, { 'X-Fake': 'Yeah' });
			});

			it('should append same-named header values', function() {
				xhr.setRequestHeader('X-Fake', 'Oh');
				xhr.setRequestHeader('X-Fake', 'yeah!');

				assert.deepEqual(xhr.requestHeaders, { 'X-Fake': 'Oh,yeah!' });
			});
		});

		describe('open', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
			});

			it('should throw an error if request is not open', function() {
				xhr = new Request();

				assert.throw(function() {
					xhr.send();
				});
			});

			it('should throw an error if send flag is true', function() {
				xhr = new Request();
				xhr.open('GET', '/');
				xhr.sendFlag = true;

				assert.throw(function() {
					xhr.send();
				});
			});

			it('should set GET body to null', function() {
				xhr.open('GET', '/');
				xhr.send('Data');

				assert.isNull(xhr.requestBody);
			});

			it('should set HEAD body to null', function() {
				xhr.open('HEAD', '/');
				xhr.send('Data');

				assert.isNull(xhr.requestBody);
			});

			it('should sets mime to text/plain', function() {
				xhr.open('POST', '/');
				xhr.send('Data');

				assert.equal(xhr.requestHeaders['Content-Type'], 'text/plain;charset=utf-8');
			});

			it('should not override mime type', function() {
				xhr.open('POST', '/');
				xhr.setRequestHeader('Content-Type', 'text/html');
				xhr.send('Data');

				assert.equal(xhr.requestHeaders['Content-Type'], 'text/html;charset=utf-8');
			});

			it('should set request body to string data', function() {
				xhr.open('POST', '/');
				xhr.send('Data');

				assert.equal(xhr.requestBody, 'Data');
			});

			it('should set error flag to false', function() {
				xhr.open('POST', '/');
				xhr.send('Data');

				assert.isFalse(xhr.errorFlag);
			});

			it('should set send flag to true', function() {
				xhr.open('GET', '/');
				xhr.send();

				assert.isTrue(xhr.sendFlag);
			});

			it('should not set send flag if not async', function() {
				xhr.open('GET', '/', false);
				xhr.send();

				assert.isFalse(xhr.sendFlag);
			});

			it('should call onreadystatechange', function() {
				var state;
				xhr.open('POST', '/', false);
				xhr.onreadystatechange = function() {
					state = this.readyState;
				};

				xhr.send('Data');

				assert.equal(state, Request.OPENED);
			});

			it('should dispatch event using DOM Event interface', function(done) {
				var listener = function(e) {
					assert.equal(e.type, 'readystatechange');
					done();
				};
				xhr.open('POST', '/', false);
				xhr.addEventListener('readystatechange', listener);
				xhr.send('Data');
			});

			it('should dispatch onSend callback if set with request as argument', function(done) {
				xhr.open('POST', '/', true);
				xhr.onSend = function(arg) {
					assert.equal(arg, xhr);
					done();
				};

				xhr.send('Data');
			});
			
			it('should dispatch onSend when async', function(done) {
				xhr.open('POST', '/', false);
				xhr.onSend = function(arg) {
					assert.equal(arg, xhr);
					done();
				};

				xhr.send('Data');
			});
		});

		describe('setResponseHeaders', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
			});

			it('should set request headers', function() {
				var headers = { id: 42 };
				xhr.open('GET', '/');
				xhr.send();
				xhr.setResponseHeaders(headers);

				assert.deepEqual(xhr.responseHeaders, headers);
			});

			it('should call setReadyState with HEADERS_RECEIVED', function(done) {
				var headers = { id: 42 };
				xhr.open('GET', '/');
				xhr.send();

				xhr.setReadyState = function(state) {
					assert.equal(state, Request.HEADERS_RECEIVED);
					done();
				};

				xhr.setResponseHeaders(headers);
			});

			it('should not call setReadyState if not async', function() {
				var headers = { id: 42 };
				var spy = [];
				xhr.open('GET', '/', false);
				xhr.send();

				xhr.setReadyState = function() {
					spy.push(0);
				};

				xhr.setResponseHeaders(headers);

				assert.deepEqual(spy, []);
			});

			it('should change readyState to HEADERS_RECEIVED if sync', function() {
				var headers = { id: 42 };
				xhr.open('GET', '/', false);
				xhr.send();
				xhr.setResponseHeaders(headers);

				assert.equal(xhr.readyState, Request.HEADERS_RECEIVED);
			});
		});

		describe('setResponseBodyAsync', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
				xhr.open('GET', '/');
				xhr.send();
				xhr.setResponseHeaders({});
			});

			it('should invoke setReadyState with LOADING state', function() {
				var spy = [];
				xhr.setReadyState = function(state) {
					spy.push(state);
				};

				xhr.setResponseBody('some text goes in here ok?');

				assert.equal(spy[0], Request.LOADING);
			});

			it('should invoke setReadyState for each 10 byte chunk', function() {
				var spy = [];
				xhr.setReadyState = function() {
					spy.push('a');
				};

				xhr.setResponseBody('Some text goes in here ok?');

				assert.lengthOf(spy, 4);
			});

			it('should invoke setReadyState for each x byte chunk', function() {
				var spy = [];
				xhr.setReadyState = function() {
					spy.push('a');
				};
				xhr.chunkSize = 20;

				xhr.setResponseBody('Some text goes in here ok?');

				assert.lengthOf(spy, 3);
			});

			it('should invoke setReadyState with partial data', function() {
				var pieces = [];
				xhr.setReadyState = function() {
					pieces.push(this.responseText);
				};
				xhr.chunkSize = 9;

				xhr.setResponseBody('Some text goes in here ok?');

				assert.equal(pieces[1], 'Some text');
			});

			it('call setReadyState with DONE state', function(done) {
				xhr.setReadyState = function(state) {
					if(state === Request.DONE) {
						done();
					}
				};
				xhr.setResponseBody('Some text goes in here ok?');
			});

			it('should throw an error if not opened', function() {
				var xhr = new Request();

				assert.throw(function() {
					xhr.setResponseBody('');
				});
			});

			it('should throw an error if no headers received', function() {
				var xhr = new Request();
				xhr.open('GET', '/');
				xhr.send();
				
				assert.throw(function() {
					xhr.setResponseBody('');
				});
			});

			it('should throw an error if body was already sent', function() {
				xhr.setResponseBody('');

				assert.throw(function() {
					xhr.setResponseBody('');
				});
			});

			it('shoud throw an error if body is not a string', function() {
				assert.throw(function() {
					xhr.setResponseBody({});
				});
			});
		});

		describe('setResponseBodySync', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
				xhr.open('GET', '/', false);
				xhr.send();
				xhr.setResponseHeaders({});
			});

			it('should not throw any error', function() {
				assert.doesNotThrow(function() {
					xhr.setResponseBody('');
				});
			});

			it('should set readyState to DONE', function() {
				xhr.setResponseBody('');

				assert.equal(xhr.readyState, Request.DONE);
			});

			it('should throw an error if responding to request twice', function() {
				xhr.setResponseBody('');

				assert.throw(function() {
					xhr.setResponseBody('');
				});
			});

			it('should not call readystatechange', function() {
				var xhr = new Request();
				var spy = [];
				var callCount;
				xhr.onreadystatechange = function() {
					spy.push('a');
				};
				xhr.open('GET', '/', false);
				xhr.send();
				callCount = spy.length;
				
				xhr.setResponseHeaders({});
				xhr.setResponseBody('hello world super body');

				assert.equal(callCount, spy.length);
			});

			it('should simulate synchronous request', function() {
				var xhr = new Request();

				xhr.onSend = function() {
					this.setResponseHeaders({});
					this.setResponseBody('Oh Yeah');
				};

				xhr.open('GET', '/', false);
				xhr.send();

				assert.equal(xhr.responseText, 'Oh Yeah');
			});
		});

		describe('respond', function() {
			var xhr, spy;

			beforeEach(function() {
				spy = [];
				xhr = new Request();
				xhr.open('GET', '/');
				xhr.onreadystatechange = function() {
					if(this.readyState === Request.DONE) {
						spy.push('a');
					}
				};
				xhr.send();
			});

			it('should call readystate handle with readyState DONE once', function() {
				xhr.respond(200, {}, '');

				assert.lengthOf(spy, 1);
			});

			it('should default to status 200, no headers and blank body', function() {
				xhr.respond();

				assert.equal(xhr.status, 200);
				assert.equal(xhr.getAllResponseHeaders(), '');
				assert.equal(xhr.responseText, '');
			});

			it('should set status', function() {
				xhr.respond(201);

				assert.equal(xhr.status, 201);
			});

			it('should set status text', function() {
				xhr.respond(201);

				assert.equal(xhr.statusText, 'Created');
			});

			it('should set headers', function() {
				var spy = [];
				var responseHeaders = { some: 'headers', foo: 'bar' };
				xhr.setResponseHeaders = function(header) {
					this.readyState = Request.RECEIVED_HEADERS;
					spy.push(header);
				};
				xhr.respond(200, responseHeaders);

				assert.deepEqual(spy[0], responseHeaders);
			});

			it('should set response text', function() {
				xhr.respond(200, {}, '"tis some body text');

				assert.equal(xhr.responseText, '"tis some body text');
			});

			it('should complete request when onreadystatechange fails', function() {
				var spy = [];
				xhr.onreadystatechange = function() {
					spy.push('called');
					throw new Error();
				};
				xhr.respond(200, {}, '"tis some body text');

				assert.lengthOf(spy, 4);
			});
		});

		describe('getResponseHeader', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
			});

			it('should return null if request is not sent', function() {
				xhr.open('GET', '/');

				assert.isNull(xhr.getResponseHeader('Content-Type'));
			});

			it('should return null if headers are not set', function() {
				xhr.open('GET', '/');
				xhr.send();

				assert.isNull(xhr.getResponseHeader('Set-Cookie'));
			});

			it('should return header value', function() {
				xhr.open('GET', '/');
				xhr.send();
				xhr.setResponseHeaders({ 'Content-Type': 'text/html' });

				assert.equal(xhr.getResponseHeader('Content-Type'), 'text/html');
			});

			it('should return header if sync', function() {
				xhr.open('GET', '/', false);
				xhr.send();
				xhr.setResponseHeaders({ 'Content-Type': 'text/html' });

				assert.equal(xhr.getResponseHeader('Content-Type'), 'text/html');
			});

			it('should return null if header not setted', function() {
				xhr.open('GET', '/');
				xhr.send();
				xhr.setResponseHeaders({});

				assert.isNull(xhr.getResponseHeader('Content-Type'));
			});

			it('should return headers case insensitive', function() {
				xhr.open('GET', '/');
				xhr.send();
				xhr.setResponseHeaders({ 'Content-Type': 'text/html' });

				assert.equal(xhr.getResponseHeader('content-type'), 'text/html');
			});
		});
	});
})();
