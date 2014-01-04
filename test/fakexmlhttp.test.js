(function() {
	'use strict';

	var assert = chai.assert;

	describe('fakeXMLHttpRequest', function() {
		var Request = hyacinth.FakeXMLHttpRequest;

		it('should be a constructor', function() {
			assert.isFunction(Request);
			assert.equal(Request.prototype.constructor, hyacinth.EventTarget);
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
	});
})();
