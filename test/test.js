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

		describe('Request, xmlhttp mock', function() {
			it('should respond to the simplest get request', function() {
				var req = new Hyacinth.Request({ method: 'GET', url: '', async: false });
				req.open('GET', '', false);
				req.send(null);
				assert.equal(req.status, 200);
			});

			it('should be async by default', function() {
				var req = new Hyacinth.Request({ method: 'GET', url: '' });
				assert.strictEqual(req._spec.async, true);
			});

			it('should do a GET by default', function() {
				var req = new Hyacinth.Request({});
				assert.strictEqual(req._spec.method, 'GET');
			});

			it('should point to the current url by default', function() {
				var req = new Hyacinth.Request({});
				assert.strictEqual(req._spec.url, '');
			});

			it('should return the default request with no parameters', function() {
				var req = new Hyacinth.Request();
				assert.deepEqual(req._spec.method, 'GET');
			});

			describe('#open', function() {
				it('should return an error when giving the wrong url', function() {
					var req = new Hyacinth.Request({ method: 'GET', url: '/path' });
					var e = req.open('GET', '', false);
					assert.instanceOf(e, Error);
					assert.deepEqual(e.expected, { url: '/path' });
					assert.deepEqual(e.actual, { url: '' });
				});

				it('should return an error when giving the wrong method', function() {
					var req = new Hyacinth.Request({ method: 'GET', url: '' });
					var e = req.open('PUT', '', false);
					assert.instanceOf(e, Error);
					assert.deepEqual(e.expected, { method: 'GET' });
					assert.deepEqual(e.actual, { method: 'PUT' });
				});

				it('should return null if everything is in order', function() {
					var req = new Hyacinth.Request({ method: 'GET', url: '', async: false });
					var e = req.open('GET', '', false);
					assert.strictEqual(e, null);
				});
			});

			describe('#send', function() {
				it('should verify the string passed with the body param', function() {
					var req = new Hyacinth.Request({ method: 'POST', body: 'super', async: false });
					req.open('POST', '', false);
					var e = req.send('random body');
					assert.instanceOf(e, Error);
					assert.deepEqual(e.expected, { body: 'super' }, 'exepted body');
					assert.deepEqual(e.actual, { body: 'random body' }, 'actual body');
				});

				it('should return null when the right body is passed', function() {
					var req = new Hyacinth.Request({ method: 'POST', body: 'cool', async: false });
					req.open('POST', '', false);
					var e = req.send('cool');
					assert.strictEqual(e, null);
				});
			});
		});
	});
})();
