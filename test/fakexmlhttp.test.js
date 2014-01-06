(function() {
	'use strict';

	var assert = chai.assert;

	describe('fakeXMLHttpRequest', function() {
		var Request = hyacinth.FakeXMLHttpRequest;

		it('should be a constructor', function() {
			assert.isFunction(Request);
			assert.equal(Request.prototype.constructor, Request);
		});

		it('should inherits xhrEventTarget', function() {
			var xhr = new Request();

			assert.instanceOf(xhr, hyacinth.XHREventTarget);
		});

		it('should start with null onreadystatechange handler', function() {
			var xhr = new Request();

			assert.isNull(xhr.onreadystatechange);
		});

		it('should implements readyState constants', function() {
			assert.strictEqual(Request.UNSENT, 0);
			assert.equal(Request.OPENED, 1);
			assert.equal(Request.HEADERS_RECEIVED, 2);
			assert.equal(Request.LOADING, 3);
			assert.equal(Request.DONE, 4);
		});

		it('should have sendFlag initially unset', function() {
			var xhr = new Request();

			assert.isFalse(xhr.sendFlag);
		});

		it('should have errorFlag initially unset', function() {
			var xhr = new Request();

			assert.isFalse(xhr.errorFlag);
		});

		it('should have request headers initially empty', function() {
			var xhr = new Request();

			assert.deepEqual(xhr.requestHeaders, {});
		});

		it('should have a request body initially null', function() {
			var xhr = new Request();

			assert.isNull(xhr.requestBody);
		});

		it('should have synchronous, upload complete and upload events flags unset', function() {
			var xhr = new Request();

			assert.isFalse(xhr.async);
			assert.isFalse(xhr.uploadComplete);
			assert.isFalse(xhr.uploadEvents);
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

			it('should set standard http methods to their uppercase match', function() {
				var methods = [ 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT' ];
				var entries = [ 'DeLeTe', 'gEt', 'hEad', 'OPtions', 'POst', 'PuT' ];
				methods.forEach(function(method, index) {
					var xhr = new Request();
					xhr.open(entries[index], '/');

					assert.equal(xhr.method, method);
				});
			});

			it('should set the method exactly when it is unknown', function() {
				xhr.open('RefVRvd', '/');

				assert.equal(xhr.method, 'RefVRvd');
			});

			it('should throw an error if the method is one of CONNECT, TRACE or TRACK', function() {
				var forbidden = [ 'CONNECT', 'TraCe', 'trACk' ];
				forbidden.forEach(function(method) {
					var xhr = new Request();
					assert.throw(function() {
						xhr.open(method, '/');
					}, 'SecurityError');
				});
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

			it('should set send flag to false', function() {
				xhr.open('GET', 'url');

				assert.isFalse(xhr.sendFlag);
			});

			it('should set response entity body to null', function() {
				xhr.open('GET', '/');

				assert.isNull(xhr.responseEntityBody);
			});

			it('should set readystate to OPENED', function() {
				xhr.open('GET', 'url');

				assert.equal(xhr.readyState, Request.OPENED);
			});

			it('should fire readystatechange event', function() {
				var called = false;
				xhr.onreadystatechange = function() {
					called = true;
				};
				xhr.open('GET', '/');

				assert.isTrue(called);
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
				}, 'InvalidStateError');
			});

			it('should throw an exception if send flag is true', function() {
				xhr.sendFlag = true;

				assert.throw(function() {
					xhr.setRequestHeader();
				}, 'InvalidStateError');
			});

			it('should disallow unsafe headers, case-insensitive', function() {
				var throwHeader = function(header) {
					assert.throw(function() {
						xhr.setRequestHeader(header, '');
					}, Error, header, header);
				};

				throwHeader('Accept-CHARSET');
				throwHeader('ACCEPT-Encoding');
				throwHeader('ConneCTION');
				throwHeader('Content-LENGTH');
				throwHeader('CooKIE');
				throwHeader('CooKIE2');
				throwHeader('Content-TRANSFER-Encoding');
				throwHeader('DatE');
				throwHeader('HosT');
				throwHeader('KeeP-Alive');
				throwHeader('RefErer');
				throwHeader('Te');
				throwHeader('TRansfer-Encoding');
				throwHeader('UpGrade');
				throwHeader('UseR-Agent');
				throwHeader('ViA');
				throwHeader('PrOxy-Oops');
				throwHeader('ProXy-otherS');
				throwHeader('SeC-Oops');
				throwHeader('SEc-sUpSon');
			});

			it('should set header and value', function() {
				xhr.setRequestHeader('X-Fake', 'Yeah');

				assert.deepEqual(xhr.requestHeaders, { 'X-Fake': 'Yeah' });
			});

			it('should append same-named header values', function() {
				xhr.setRequestHeader('X-Fake', 'Oh');
				xhr.setRequestHeader('X-Fake', 'yeah!');

				assert.deepEqual(xhr.requestHeaders, { 'X-Fake': 'Oh, yeah!' });
			});
		});

		describe('send', function() {
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

		describe('getAllResponseHeaders', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
			});

			it('should return null if request is not send', function() {
				xhr.open('GET', '/');

				assert.strictEqual(xhr.getAllResponseHeaders(), null);
			});

			it('should return null if headers not received', function() {
				xhr.open('GET', '/');
				xhr.send();

				assert.strictEqual(xhr.getAllResponseHeaders(), null);
			});

			it('should return Http raw headers', function() {
				xhr.open('GET', '/');
				xhr.send();
				xhr.setResponseHeaders({
					'Content-Type': 'text/html',
					'Content-Length': 32
				});

				assert.equal(xhr.getAllResponseHeaders(), 'Content-Type: text/html\r\nContent-Length: 32\r\n');
			});

			it('should return raw headers when not async', function() {
				xhr.open('GET', '/', false);
				xhr.send();
				xhr.setResponseHeaders({
					'Content-Type': 'text/html',
					'Content-Length': 32
				});

				assert.equal(xhr.getAllResponseHeaders(), 'Content-Type: text/html\r\nContent-Length: 32\r\n');
			});
		});

		describe('abort', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
			});

			it('should set aborted flag to true', function() {
				xhr.aborted = false;
				xhr.abort();

				assert.isTrue(xhr.aborted);
			});

			it('should set responseText to null', function() {
				xhr.responseText = 'partial data';
				xhr.abort();

				assert.isNull(xhr.responseText);
			});

			it('should set errorFlag to true', function() {
				xhr.errorFlag = false;
				xhr.abort();

				assert.isTrue(xhr.errorFlag);
			});

			it('should fire onerror event', function() {
				var spy = [];
				xhr.onerror = function() {
					spy.push('called');
				};
				xhr.abort();

				assert.lengthOf(spy, 1);
			});

			it('should empty request headers', function() {
				xhr.open('GET', '/');
				xhr.setRequestHeader('X-Test', 'Sumptn');

				xhr.abort();

				assert.deepEqual(xhr.requestHeaders, {});
			});

			it('should set state to DONE if sent before', function() {
				var readyState;
				xhr.open('GET', '/');
				xhr.send();

				xhr.onreadystatechange = function() {
					readyState = this.readyState;
				};

				xhr.abort();

				assert.equal(readyState, Request.DONE);
			});

			it('should set send flag to false if sent before', function() {
				xhr.open('GET', '/');
				xhr.send();
				xhr.abort();

				assert.isFalse(xhr.sendFlag);
			});

			it('should dispatch readystatechange event if sent before', function() {
				var spy = [];
				xhr.open('GET', '/');
				xhr.send();

				xhr.onreadystatechange = function() {
					spy.push('called');
				};
				xhr.abort();

				assert.lengthOf(spy, 1);
			});

			it('should set readyState to unsent if sent before', function() {
				xhr.open('GET', '/');
				xhr.send();
				xhr.abort();

				assert.strictEqual(xhr.readyState, Request.UNSENT);
			});

			it('should not dispatch readystatechange event if readyState is UNSENT', function() {
				var spy = [];
				xhr.onreadystatechange = function() {
					spy.push('called');
				};
				xhr.abort();

				assert.lengthOf(spy, 0);
			});

			it('should not dispatch readystatechange event if readyState is OPENED but not sent', function() {
				var spy = [];
				xhr.open('GET', '/');
				xhr.onreadystatechange = function() {
					spy.push('called');
				};
				xhr.abort();

				assert.lengthOf(spy, 0);
			});
		});

		describe('responseXML', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
				xhr.open('GET', '/');
				xhr.send();
			});

			it('should be null initially', function() {
				var xhr = new Request();

				assert.isNull(xhr.responseXML);
			});

			it('should be null when the response body is empty', function() {
				xhr.respond(200, {}, '');

				assert.isNull(xhr.responseXML);
			});

			it('should parse XML for application/xml content-type', function() {
				xhr.respond(200, { 'Content-Type': 'application/xml' }, '<div><h1>Hola!</h1><div>');

				var doc = xhr.responseXML;
				var elements = doc.documentElement.getElementsByTagName('h1');
				assert.lengthOf(elements, 1);
				assert.equal(elements[0].tagName, 'h1');
			});

			it('should parse XML for test/xml content-type', function() {
				xhr.respond(200, { 'Content-Type': 'text/xml' }, '<div><h1>Hola!</h1><div>');

				assert.instanceOf(xhr.responseXML, Document);
			});

			it('should parse XML for custom xml content-type', function() {
				xhr.respond(200, { 'Content-Type': 'text/html+xml' }, '<div><h1>Hola!</h1><div>');

				assert.instanceOf(xhr.responseXML, Document);
			});

			it('should parse XML if no content-type', function() {
				xhr.respond(200, {}, '<div><h1>Hola!</h1><div>');

				assert.instanceOf(xhr.responseXML, Document);
			});

			it('should not parse XML with content type text/plain', function() {
				xhr.respond(200, { 'Content-Type': 'text/plain' }, '<div><h1>Hola!</h1><div>');

				assert.isNull(xhr.responseXML);
			});

			it('should not parse XML with content type text/plain if sync', function() {
				xhr.respond(200, { 'Content-Type': 'text/plain' }, '<div><h1>Hola!</h1><div>');

				assert.isNull(xhr.responseXML);
			});
		});

		describe('upload', function() {
			var xhr;

			beforeEach(function() {
				xhr = new Request();
				xhr.open('POST', '/');
			});

			it('should trigger progress event with xhr.uploadProgress', function(done) {
				xhr.upload.addEventListener('progress', function(e) {
					assert.equal(e.total, 100);
					assert.equal(e.loaded, 20);
					done();
				});
				xhr.uploadProgress({
					total: 100,
					loaded: 20
				});
			});

			it('should trigger load event on success', function(done) {
				xhr.upload.addEventListener('load', function() {
					assert.equal(xhr.readyState, Request.DONE);
					assert.notEqual(xhr.status, 0);
					done();
				});

				xhr.send();
				xhr.respond(200, {}, '');
			});

			it('should trigger event with 100% progress on load', function(done) {
				xhr.upload.addEventListener('progress', function(e) {
					assert.equal(e.total, 100);
					assert.equal(e.loaded, 100);
					done();
				});

				xhr.send();
				xhr.respond(200, {}, '');
			});

			it('should trigger abort event on cancel', function(done) {
				xhr.upload.addEventListener('abort', function() {
					assert.equal(xhr.readyState, Request.UNSENT);
					assert.strictEqual(xhr.status, 0);

					done();
				});

				xhr.send();
				xhr.abort();
			});

			it('should trigger error event with uploadError', function(done) {
				xhr.upload.addEventListener('error', function(e) {
					assert.equal(e.detail.message, 'foobar');
					done();
				});

				xhr.uploadError(new Error('foobar'));
			});
		});
	});
})();
