(function() {
	"use strict";

	var Hyacinth = window.Hyacinth = window.Hyacinth || {};
	var Request = function(spec) {
		this.status = 200;
		this._spec = {
			async: true,
			method: 'GET',
			url: ''
		};
		Object.keys(spec || {}).forEach(function(key) {
			this._spec[key] = spec[key];
		}, this);
	};

	var Assertion = function(mess, expected, actual) {
		this.expected = expected;
		this.actual = actual;
		this.message = mess;
	};
	Assertion.prototype = Object.create(Error.prototype);

	Request.prototype.open = function(method, url, async) {
		var params = { method: method, url: url, async: async };
		var expected = {};
		var actual = {};
		var wrongParams = Object.keys(params).every(function(key) {
			if(params[key] !== this._spec[key]) {
				expected[key] = this._spec[key];
				actual[key] = params[key];
				return false;
			} else {
				return true;
			}
		}, this);
		if(!wrongParams) {
			var err = new Assertion('wrong params', expected, actual);
			return err;
		} else {
			return null;
		}
	};

	Request.prototype.send = function(body) {
		if(this._spec.body === body) {
			return null;
		} else {
			return new Assertion('wrong body', { body: this._spec.body }, { body: body });
		}
	};
	
	Hyacinth.Request = Request;
	Hyacinth.version = '0.0.1-dev';
})();
