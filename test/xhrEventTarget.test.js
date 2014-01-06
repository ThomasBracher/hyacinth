(function() {
	'use strict';

	var assert = chai.assert;

	var CallSpy = function() {
		this.called = [];
	};
	CallSpy.prototype.get = function(key) {
		var _this = this;
		return function() {
			_this.called.push(key);
		};
	};
	var events = [ 'abort', 'error', 'load', 'loadend', 'loadstart', 'progress', 'timeout'];

	describe('hyacinth.xhrEventTarget', function() {
		var XHREventTarget = hyacinth.XHREventTarget;

		it('should inherit of EventTarget interface', function() {
			var xhr = new XHREventTarget();

			assert.instanceOf(xhr, hyacinth.EventTarget);
		});

		it('should have every onX events set to null', function() {
			var xhr = new XHREventTarget();

			events.forEach(function(event) {
				assert.isNull(xhr['on' + event], 'on' + event + ' should be null');
			});
		});

		it('should dispatch event to the listeners and call onX handler', function() {
			var xhr = new XHREventTarget();

			events.forEach(function(type) {
				var spy = new CallSpy();
				xhr['on' + type] = spy.get(type);
				xhr.addEventListener(type, spy.get(type));
				xhr.dispatchEvent(new hyacinth.Event(type));

				assert.deepEqual(spy.called, [ type, type ]);
			});
		});

		it('should fail silently when onX is not a function', function() {
			var xhr = new XHREventTarget();

			events.forEach(function(type) {
				var spy = new CallSpy();
				xhr['on' + type] = {};
				xhr.addEventListener(type, spy.get(type));
				xhr.dispatchEvent(new hyacinth.Event(type));

				assert.deepEqual(spy.called, [ type ]);
			});
		});
	});
})();
