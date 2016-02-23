(function() {

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

	describe('hyacinth.EventTarget', function() {
		var EventTarget = hyacinth.EventTarget;
		var Event = hyacinth.Event;
		var target;

		beforeEach(function() {
			target = new EventTarget();
		});

		it('should notify event listener', function(done) {
			var event = new Event('dummy');
			var listener = function(e) {
				assert.equal(e, event);
				done();
			};
			target.addEventListener('dummy', listener);

			target.dispatchEvent(event);
		});

		it('should notify event listener with emitter as this', function(done) {
			var event = new Event('dummy');
			var listener = function(e) {
				assert.equal(this, target);
				done();
			};
			target.addEventListener('dummy', listener);

			target.dispatchEvent(event);
		});

		it('should notify all event listeners', function() {
			var spy = new CallSpy();
			var listeners = [ spy.get(0), spy.get(1) ];
			target.addEventListener('dummy', listeners[0]);
			target.addEventListener('dummy', listeners[1]);

			target.dispatchEvent(new Event('dummy'));

			assert.deepEqual(spy.called, [0, 1]);
		});

		it('should notify event listener of type listener', function(done) {
			var listener = {};
			listener.handleEvent = function() {
				assert.equal(this, listener);
				done();
			};
			target.addEventListener('dummy', listener);
			target.dispatchEvent(new Event('dummy'));
		});

		it('should not notify listeners of other events', function() {
			var spy = new CallSpy();
			var listeners = [ spy.get(0), spy.get(1) ];
			target.addEventListener('dummy', listeners[0]);
			target.addEventListener('other', listeners[1]);

			target.dispatchEvent(new Event('dummy'));
			assert.deepEqual(spy.called, [0]);
		});

		it('should notify existing listeners after removing one', function() {
			var spy = new CallSpy();
			var listeners = [ spy.get(0), spy.get(1), spy.get(2) ];
			target.addEventListener('dummy', listeners[0]);
			target.addEventListener('dummy', listeners[1]);
			target.addEventListener('dummy', listeners[2]);
			target.removeEventListener('dummy', listeners[1]);

			target.dispatchEvent(new Event('dummy'));

			assert.deepEqual(spy.called, [0, 2]);
		});

		it('should remove event listeners of type listeners', function() {
			var spy = new CallSpy();
			var Listener = function(key) { this.handleEvent = spy.get(key); };
			var listeners = [ new Listener(0), new Listener(1), new Listener(2) ];
			target.addEventListener('dummy', listeners[0]);
			target.addEventListener('dummy', listeners[1]);
			target.addEventListener('dummy', listeners[2]);
			target.removeEventListener('dummy', listeners[1]);

			target.dispatchEvent(new Event('dummy'));

			assert.deepEqual(spy.called, [0, 2]);
		});

		it('should return false when event.preventDefault is not called', function() {
			target.addEventListener('dummy', function() {});
			var result = target.dispatchEvent(new Event('dummy'));

			assert.isFalse(result);
		});

		it('should return true when event.preventDefault is called', function() {
			target.addEventListener('dummy', function(e) {
				e.preventDefault();
			});

			var result = target.dispatchEvent(new Event('dummy'));

			assert.isTrue(result);
		});
	});
})();
