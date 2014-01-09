(function() {
	'use strict';

	var assert = chai.assert;

	var server = hyacinth.server;
	var Server = hyacinth.Server;

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
	});
})();
