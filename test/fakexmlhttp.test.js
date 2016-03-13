var hyacinth = require('../hyacinth');
var assert = chai.assert;

describe('fakeXMLHttpRequest', function() {
	var Request = hyacinth.FakeXMLHttpRequest;
	var xhr;

	before(function(done) {
		xhr = new Request();
		done();
	});

	it('should be a constructor', function() {
		assert.isFunction(Request);
		assert.equal(Request.prototype.constructor, Request);
	});

	it('should inherits xhrEventTarget', function() {
		assert.instanceOf(xhr, hyacinth.XHREventTarget);
	});

	it('should fire an create event on the xhr object', function(done) {
		var xhr;
		Request.oncreate = function(e) {
			assert.deepEqual(e.xhr, xhr);
			Request.oncreate = null;
			done();
		};

		xhr = new Request();
	});

	it('should start with null onreadystatechange handler', function() {
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
		assert.isFalse(xhr.sendFlag);
	});

	it('should have errorFlag initially unset', function() {
		assert.isFalse(xhr.errorFlag);
	});

	it('should have request headers initially empty', function() {
		assert.deepEqual(xhr.requestHeaders, {});
	});

	it('should have a request body initially null', function() {
		assert.isNull(xhr.requestBody);
	});

	it('should have synchronous, upload complete and upload events flags unset', function() {
		assert.isTrue(xhr.async);
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

		it('should throw an error if timeout is not zero and async false', function() {
			xhr.timeout = '34';

			assert.throw(function() {
				xhr.open('GET', '/', false);
			}, 'InvalidAccessError');
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

	describe('timeout', function() {
		it('should be initially 0', function() {
			var xhr = new Request();

			assert.deepEqual(xhr.timeout, 0);
		});

		it('should throw an error when async is false', function() {
			var xhr = new Request();
			xhr.open('GET', '/', false);

			assert.throw(function() {
				xhr.timeout = 10;
			}, 'InvalidAccessError');
		});

		it('should set its value to the new value', function() {
			var xhr = new Request();
			xhr.open('GET', '/');

			xhr.timeout = 234;
			assert.equal(xhr.timeout, 234);
		});
	});

	describe('upload', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
			xhr.open('POST', '/');
		});

		it('should be an instance of xhrEventTarget', function() {
			assert.instanceOf(xhr.upload, hyacinth.XHREventTarget);
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
			}, 'InvalidStateError');
		});

		it('should throw an error if send flag is true', function() {
			xhr = new Request();
			xhr.open('GET', '/');
			xhr.sendFlag = true;

			assert.throw(function() {
				xhr.send();
			}, 'InvalidStateError');
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

		it('should set requestBody to null if no data', function() {
			xhr.open('POST', '/');
			xhr.send();

			assert.isNull(xhr.requestBody);
		});

		it('should sets mime to text/plain if data is string', function() {
			xhr.open('POST', '/');
			xhr.send('Data');

			assert.equal(xhr.requestHeaders['Content-Type'], 'text/plain; charset=utf-8');
		});

		it('should not override mime type if data is string', function() {
			xhr.open('POST', '/');
			xhr.setRequestHeader('Content-Type', 'text/html');
			xhr.send('Data');

			assert.equal(xhr.requestHeaders['Content-Type'], 'text/html; charset=utf-8');
		});

		it('should set charset to utf-8 if charset is not utf-8 and data is string', function() {
			xhr.open('POST', '/');
			xhr.setRequestHeader('Content-Type', 'text/html; charset=ascii');
			xhr.send('Data');

			assert.equal(xhr.requestHeaders['Content-Type'], 'text/html; charset=utf-8');
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

		it('should set upload complete flag if there is no request body', function() {
			xhr.open('POST', '/');
			xhr.send();

			assert.isTrue(xhr.uploadComplete);
		});

		it('should not set upload complete flag when there is a request body', function() {
			xhr.open('POST', '/');
			xhr.send('Data');

			assert.isFalse(xhr.uploadComplete);
		});

		it('should set send flag to true', function() {
			xhr.open('GET', '/');
			xhr.send();

			assert.isTrue(xhr.sendFlag);
		});

		it('should fire progress event named loadstart if async', function(done) {
			xhr.open('GET', '/');
			xhr.onloadstart = function() {
				done();
			};
			xhr.send();
		});

		it('should fire loadstart on upload if upload complete flag is unset', function(done) {
			xhr.open('POST', '/');
			xhr.upload.onloadstart = function() {
				done();
			};
			xhr.send('loadstart upload');
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

		it('should dispatch onsend callback if set with request as argument', function(done) {
			xhr.open('POST', '/', true);
			xhr.onsend = function(e) {
				assert.equal(e.xhr, xhr);
				done();
			};

			xhr.send('Data');
		});

		it('should dispatch onsend when async', function(done) {
			xhr.open('POST', '/', false);
			xhr.onsend = function(e) {
				assert.equal(e.xhr, xhr);
				done();
			};

			xhr.send('Data');
		});
	});

	describe('abort', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should set the async flag', function() {
			xhr.async = false;
			xhr.abort();

			assert.isTrue(xhr.async);
		});

		it('should set errorFlag to true', function() {
			xhr.errorFlag = false;
			xhr.abort();

			assert.isTrue(xhr.errorFlag);
		});

		describe('if ready state is OPENED, HEADERS_RECEIVED or UPLOAD and send flag set', function() {
			var xhrs;

			beforeEach(function() {
				var xhr0 = new Request();
				var xhr1 = new Request();
				var xhr2 = new Request();
				xhr0.readyState = Request.OPENED;
				xhr0.sendFlag = true;
				xhr1.sendFlag = true;
				xhr1.readyState = Request.UPLOAD;
				xhr2.sendFlag = true;
				xhr2.readyState = Request.HEADERS_RECEIVED;
				xhrs = [ xhr0, xhr1, xhr2 ];
			});

			it('should unset the send flag', function() {
				xhrs.forEach(function(xhr) {
					xhr.abort();

					assert.isFalse(xhr.sendFlag);
				});
			});

			it('should fire a readystatechange event with DONE state', function() {
				xhrs.forEach(function(xhr) {
					var called = false;
					xhr.onreadystatechange = function() {
						assert.equal(this.readyState, Request.DONE);
						called = true;
					};
					xhr.abort();

					assert.isTrue(called);
				});
			});

			it('should fire a progress event', function() {
				xhrs.forEach(function(xhr) {
					var called = false;
					xhr.onprogress = function() {
						called = true;
					};
					xhr.abort();

					assert.isTrue(called);
				});
			});

			it('should fire an abort event', function() {
				xhrs.forEach(function(xhr) {
					var called = false;
					xhr.onabort = function() {
						called = true;
					};
					xhr.abort();

					assert.isTrue(called);
				});
			});

			it('should fire a loadend event', function() {
				xhrs.forEach(function(xhr) {
					var called = false;
					xhr.onloadend = function() {
						called = true;
					};
					xhr.abort();

					assert.isTrue(called);
				});
			});

			it('should fire progress, abort and loadend event on upload object while setting the loadcomplete flag if it is previously unset', function() {
				xhrs.forEach(function(xhr) {
					var called = [];
					xhr.uploadComplete = false;
					xhr.upload.onprogress = function() {
						assert.isTrue(xhr.uploadComplete);
						called.push('progress');
					};
					xhr.upload.onabort = function() {
						called.push('abort');
					};
					xhr.upload.onloadend = function() {
						called.push('loadend');
					};

					xhr.abort();
					assert.deepEqual(called, ['progress', 'abort', 'loadend']);
				});
			});

			it('should not fire progress, abort and loadend if loadcomplete is set', function() {
				xhrs.forEach(function(xhr) {
					var called = [];
					xhr.uploadComplete = true;
					xhr.upload.onprogress = function() {
						called.push('progress');
					};
					xhr.upload.onabort = function() {
						called.push('abort');
					};
					xhr.upload.onloadend = function() {
						called.push('loadend');
					};

					xhr.abort();
					assert.deepEqual(called, []);
				});
			});

			it('should finally set UNSENT readystatus without firing the event', function() {
				xhrs.forEach(function(xhr) {
					var called = [];
					xhr.onreadystatechange = function() {
						called.push(this.readyState);
					};
					xhr.abort();

					assert.equal(xhr.readyState, Request.UNSENT);
					assert.deepEqual(called, [ Request.DONE ]);
				});
			});
		});

		describe('if state is UNSENT, DONE or OPENED and sendflag unset', function() {
			var xhrs;
			beforeEach(function() {
				var xhr0 = new Request();
				var xhr1 = new Request();
				var xhr2 = new Request();
				xhr0.readyState = Request.UNSENT;
				xhr1.readyState = Request.OPENED;
				xhr1.sendFlag = false;
				xhr2.readyState = Request.DONE;
				xhr2.sendFlag = true;
				xhrs = [ xhr0, xhr1, xhr2 ];
			});

			it('should not fire any event', function() {
				var called = false;
				var handle = function() { called = true; };
				xhrs.forEach(function(xhr) {
					xhr.onreadystatechange = handle;
					xhr.onprogress = handle;
					xhr.onabort = handle;
					xhr.onloadend = handle;
					xhr.abort();

					assert.isFalse(called);
				});
			});

			it('should est ready state to UNSENT at the end', function() {
				xhrs.forEach(function() {
					xhr.abort();

					assert.strictEqual(xhr.readyState, Request.UNSENT);
				});
			});
		});
	});

	describe('abort on send', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
			xhr.open('GET', '/');
			xhr.send();
		});

		it('should set the error flag', function() {
			xhr.abort();

			assert.isTrue(xhr.errorFlag);
		});

		it('should throw an error and ready state DONE if synchronous', function() {
			var xhr = new Request();
			xhr.open('GET', '/', false);
			xhr.send();

			assert.throw(function() {
				xhr.abort();
			}, 'AbortError');
			assert.equal(xhr.readyState, Request.DONE);
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

			xhr.onsend = function() {
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

		it('should fire progress, load and loadend events', function() {
			var spy = [];
			xhr.onload = function() { spy.push('load'); };
			xhr.onprogress = function() { spy.push('progress'); };
			xhr.onloadend = function() { spy.push('loadend'); };

			xhr.respond(200, {}, 'some text');

			assert.deepEqual(spy, ['progress', 'load', 'loadend']);
		});

		it('should fire progress, load and loadend events before headers are received on upload object and set uploadcomplete flag', function() {
			var spy = [];
			var template = function(type) {
				return function() {
					assert.isTrue(xhr.uploadComplete);
					assert.deepEqual(xhr.status, 0);
					spy.push(type);
				};
			};
			xhr.upload.onprogress = template('progress');
			xhr.upload.onload = template('load');
			xhr.upload.onloadend = template('loadend');

			xhr.respond(200, {}, 'some data');

			assert.deepEqual(spy, ['progress', 'load', 'loadend']);
		});
	});

	describe('status', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should be 0 if UNSENT', function() {
			assert.strictEqual(xhr.status, 0);
		});

		it('should be 0 if OPENED', function() {
			xhr.open('GET', '/', false);
			assert.strictEqual(xhr.status, 0);
			xhr.send();
			assert.strictEqual(xhr.status, 0);
		});

		it('should be 0 if aborted (error flag set)', function() {
			xhr.status = 234;
			xhr.abort();
			assert.strictEqual(xhr.status, 0);
		});
	});

	describe('status Text', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should be empty string if UNSENT', function() {
			assert.strictEqual(xhr.statusText, '');
		});

		it('should be empty string if OPENED', function() {
			xhr.open('GET', '/', true);
			assert.strictEqual(xhr.statusText, '');
			xhr.send();
			assert.strictEqual(xhr.statusText, '');
		});

		it('should be empty string if aborted (error flag is set)', function() {
			xhr.statusText = 'hello world';
			xhr.abort();
			assert.strictEqual(xhr.statusText, '');
		});
	});

	describe('getResponseHeader', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should return null if UNSENT', function() {
			xhr.readyState = Request.UNSENT;
			this.responseHeaders = { 'Content-Type': 'super' };

			assert.isNull(xhr.getResponseHeader('Content-Type'));
		});

		it('should return null if OPENED', function() {
			xhr.readyState = Request.OPENED;
			this.responseHeaders = { 'Content-Type': 'super' };

			assert.isNull(xhr.getResponseHeader('Content-Type'));
		});

		it('should return null if aborted (error flag set)', function() {
			xhr.readyState = Request.HEADERS_RECEIVED;
			xhr.errorFlag = true;
			xhr.responseHeaders = { 'Content-Type': 'super' };

			assert.isNull(xhr.getResponseHeader('Content-Type'));
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

		it('should return null if header is case-insensitive match for Set-Cookie or Set-Cookie2', function() {
			xhr.readyState = Request.DONE;
			xhr.responseHeaders = {
				'set-COOKIE': 'one',
				'SET-cookie2': 'two'
			};

			assert.isNull(xhr.getResponseHeader('set-COOKIE'));
			assert.isNull(xhr.getResponseHeader('sEt-coOkie2'));
		});
	});


	describe('getAllResponseHeaders', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should return empty string if UNSENT', function() {
			xhr.readyState = Request.UNSENT;
			xhr.responseHeaders = { 'Content-Type': 'text/plain' };

			assert.strictEqual(xhr.getAllResponseHeaders(), '');
		});

		it('should return empty string if OPENED', function() {
			xhr.readyState = Request.OPENED;
			xhr.responseHeaders = { 'Content-Type': 'text/plain' };

			assert.strictEqual(xhr.getAllResponseHeaders(), '');
		});

		it('should return empty string if aborted (error flag set)', function() {
			xhr.readyState = Request.DONE;
			xhr.errorFlag = true;
			xhr.responseHeaders = { 'Content-Type': 'text/plain' };

			assert.strictEqual(xhr.getAllResponseHeaders(), '');
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

		it('should return every headers except for set-cookie and set-cookie2, case-insensitive', function() {
			xhr.readyState = Request.DONE;
			xhr.responseHeaders = {
				'Content-Type': 'text/html',
				'Set-CoOkiE': 'super',
				'SET-cookie2': 'hot',
				'Content-Length': 32
			};

			assert.equal(xhr.getAllResponseHeaders(), 'Content-Type: text/html\r\nContent-Length: 32\r\n');
		});
	});

	describe('override mimetype', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should throw an error if xhr is LOADING', function() {
			xhr.readyState = Request.LOADING;

			assert.throw(function() {
				xhr.overrideMimeType();
			}, 'InvalidStateError');
		});

		it('should throw an error if xhr is DONE', function() {
			xhr.readyState = Request.DONE;

			assert.throw(function() {
				xhr.overrideMimeType();
			}, 'InvalidStateError');
		});

		it('should set the current mime type otherwise', function() {
			xhr.overrideMimeType('text/html');

			assert.equal(xhr.mimeType, 'text/html');
		});
	});

	describe('reponseType', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
		});

		it('should throw an error if LOADING', function() {
			xhr.readyState = Request.LOADING;

			assert.throw(function() {
				xhr.responseType = 'super';
			}, 'InvalidStateError');
		});

		it('should throw an error if DONE', function() {
			xhr.readyState = Request.DONE;

			assert.throw(function() {
				xhr.responseType = 'hello';
			}, 'InvalidStateError');
		});

		it('should throw an error if not async', function() {
			xhr.async = false;

			assert.throw(function() {
				xhr.responseType = 'hello';
			}, 'InvalidAccessError');
		});

		it('should return an empty string if not setted', function() {
			assert.strictEqual(xhr.responseType, '');
		});

		it('should be setted and return the value if not DONE, LOADING or not async', function() {
			xhr.readyState = Request.HEADERS_RECEIVED;
			xhr.async = true;

			xhr.responseType = 'text';
			assert.equal(xhr.responseType, 'text');
		});
	});

	describe('response', function() {
		var xhr;

		beforeEach(function() {
			xhr = new Request();
			xhr.open('GET', '/');
			xhr.send();
		});

		it('should be a string if type is empty or text', function() {
			xhr.responseType = 'text';
			xhr.respond(200, {}, '<div>hello</div>');

			assert.equal(xhr.response, '<div>hello</div>');
		});

		it('should be empty string if aborted and type is text or ""', function() {
			xhr.responseType = 'text';
			xhr.response = 'hello';
			xhr.abort();

			assert.strictEqual(xhr.response, '');
		});

		it('should be null if the responseType is not "text" and state not DONE', function() {
			xhr.responseType = 'json';
			assert.strictEqual(xhr.response, null);
		});

		it('should be null if aborted (error flag set)', function() {
			xhr.responseType = 'json';
			xhr.response = { salut: 'hello' };
			xhr.abort();

			assert.strictEqual(xhr.response, null);
		});

		it('should return a json object if type is json', function() {
			var obj = { hello: 'salut' };
			xhr.responseType = 'json';
			xhr.respond(200, {}, JSON.stringify(obj));

			assert.deepEqual(xhr.response, obj);
		});

		it('should return null if the json is malformed', function() {
			var obj = '{ hello: "salut" }';
			xhr.responseType = 'json';
			xhr.respond(200, {}, obj);

			assert.strictEqual(xhr.response, null);
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
			var elements = doc.getElementsByTagName('h1');
			assert.lengthOf(elements, 1);
			assert.equal(elements[0].tagName, 'H1');
		});

		it('should parse XML for test/xml content-type', function() {
			xhr.respond(200, { 'Content-Type': 'text/xml' }, '<div><h1>Hola!</h1><div>');

			assert.instanceOf(xhr.responseXML, Document);
		});

		it('should parse XML for custom xml content-type', function() {
			xhr.respond(200, { 'Content-Type': 'text/html+xml' }, '<div><h1>Hola!</h1><div>');

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

});
