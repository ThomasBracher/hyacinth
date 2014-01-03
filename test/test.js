(function() {
	'use strict';

	var assert = chai.assert;

	describe('Hyacinth', function() {
		describe('Globals', function() {
			it('should always have a version', function() {
				assert.isString(Hyacinth.version);
				assert.match(Hyacinth.version, /^\d+.\d+.\d+(-beta|-dev)?/);
			});
		});

		describe('#deepCompare', function() {
			var compare = Hyacinth.compare;

			it('should return an error when two objects are different', function() {
				var e = compare({}, {a: 34}, 'no "a" property');
				assert.instanceOf(e, Error);
				assert.deepEqual(e.expected, {});
				assert.deepEqual(e.actual, {a: 34});
				assert.equal(e.message, 'no "a" property');
			});

			it('should return null when the two objects are deep equal', function() {
				var e = compare({b: {a: [1, 3]}}, {b: {a: [1, 3]}}, 'none');
				assert.strictEqual(e, null);
			});
		});

		describe('Request, XMLHttpRequest mock', function() {
			var Request = Hyacinth.Request;

			it('should respond to the simplest get request', function() {
				var req = new Request();
				req.open('GET', '', false);
				req.send(null);
				assert.equal(req.status, 200);
			});

			it('should be async by default', function() {
				var req = new Request();
				assert.strictEqual(req._spec.async, true);
			});

			it('should do a GET by default', function() {
				var req = new Request();
				assert.strictEqual(req._spec.method, 'GET');
			});

			it('should point to the current url by default', function() {
				var req = new Request();
				assert.strictEqual(req._spec.url, '');
			});

			it('should return the default request with no parameters', function() {
				var req = new Request();
				assert.deepEqual(req._spec.method, 'GET');
			});

			describe('#open', function() {
				it('should return an error when giving the wrong url', function() {
					var req = new Request({ url: '/path' });
					var e = req.open('GET', '', false);
					assert.instanceOf(e, Error);
					assert.deepEqual(e.expected, '/path');
					assert.deepEqual(e.actual, '');
					assert.equal(e.message, 'wrong url');
				});

				it('should return an error when giving the wrong method', function() {
					var req = new Request();
					var e = req.open('PUT', '', false);
					assert.instanceOf(e, Error);
					assert.deepEqual(e.expected, 'GET');
					assert.deepEqual(e.actual, 'PUT');
					assert.equal(e.message, 'wrong method');
				});

				it('should return null if everything is in order', function() {
					var req = new Request();
					var e = req.open('GET', '', false);
					assert.strictEqual(e, null);
				});
			});

			describe('#send', function() {
				it('should verify the string passed with the body param', function() {
					var req = new Request({ method: 'POST', body: 'super' });
					req.open('POST', '', false);
					var e = req.send('random body');
					assert.instanceOf(e, Error);
					assert.deepEqual(e.expected, 'super', 'exepted body');
					assert.deepEqual(e.actual, 'random body', 'actual body');
					assert.equal(e.message, 'wrong body');
				});

				it('should return null when the right body is passed', function() {
					var req = new Request({ method: 'POST', body: 'cool' });
					req.open('POST', '', false);
					var e = req.send('cool');
					assert.strictEqual(e, null);
				});

				it('should return an error if #open was not called beforehand', function() {
					var req = new Request();
					var e = req.send();
					assert.instanceOf(e, Error);
					assert.equal(e.message, '#open has to be called first');
				});
			});

			describe('#responseText', function() {
				it('should be setted once the #send is called', function() {
					var req = new Request({
						response: {
							body: 'hello'
						}
					});
					req.open('GET', '', false);
					req.send();
					assert.equal(req.status, 200);
					assert.equal(req.responseText, 'hello');
				});

				it('should be null when the request is not send', function() {
					var req = new Request();
					req.open('GET', '', true);
					assert.strictEqual(req.responseText, undefined);
				});

				it('should not be setted until #complete is called in async', function() {
					var req = new Request({
						response: {
							body: 'text'
						}
					});
					req.open('GET', '', true);
					req.send();
					assert.strictEqual(req.responseText, undefined);
					req.complete();
					assert.equal(req.responseText, 'text');
				});
			});

			describe('#getResponseHeader', function() {
				it('should return the headers given in the spec', function() {
					var req = new Request({
						response: {
							headers: {
								'Content-Type': 'text/html'
							}
						}
					});
					req.open('GET', '', true);
					req.send();
					req.complete();
					var content = req.getResponseHeader('Content-Type');
					assert.equal(content, 'text/html');
				});

				it('should return null if the header does not exist', function() {
					var req = new Request({
						response: {
							headers: {
								'Content-Type': 'text/html'
							}
						}
					});
					req.open('GET', '', true);
					req.send();
					req.complete();
					var content = req.getResponseHeader('Accept');
					assert.strictEqual(content, null);
				});

				it('should return undefined when request not completed', function() {
					var req = new Request({
						response: {
							headers: {
								'Content-Type': 'text/html'
							}
						}
					});
					req.open('GET', '', true);
					req.send();
					var content = req.getResponseHeader('Content-Type');
					assert.strictEqual(content, null);
				});
			});

			describe('#getAllResponseHeaders', function() {
				it('should return all headers given', function() {
					var req = new Request({
						response: {
							headers: {
								'Content-Type': 'application/json',
								'Accept': 'application/json'
							}
						}
					});
					req.open('GET', '', true);
					req.send();
					req.complete();
					var headers = req.getAllResponseHeaders();
					assert.equal(headers, 'Content-Type: application/json\nAccept: application/json\n');
				});
			});

			describe('#setRequestHeader', function() {
				it('should return an error when send is called when headers not matching', function() {
					var req = new Request({
						headers: {
							'Content-Type': 'application/json'
						}
					});
					req.open('GET', '', false);
					req.setRequestHeader('Content-Type', 'text/html');
					var e = req.send();
					assert.deepEqual(e.expected, { 'Content-Type': 'application/json' });
					assert.deepEqual(e.actual, { 'Content-Type': 'text/html' });
					assert.equal(e.message, 'wrong headers');
				});
			});
		});
	});
})();
