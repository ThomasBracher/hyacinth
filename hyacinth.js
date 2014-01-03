(function() {
	"use strict";

	var Hyacinth = window.Hyacinth = window.Hyacinth || {};

	var Assertion = function(mess, expected, actual) {
		this.expected = expected;
		this.actual = actual;
		this.message = mess;
	};
	Assertion.prototype = Object.create(Error.prototype);

	var compare = Hyacinth.compare = function(expected, actual, message) {
		if(JSON.stringify(expected) === JSON.stringify(actual)) {
			return null;
		} else {
			return new Assertion(message, expected, actual);
		}
	};

	var Request = function(spec) {
		this.status = 200;
		this._spec = {
			async: true,
			method: 'GET',
			url: '',
			headers: {}
		};
		this._headers = {};
		Object.keys(spec || {}).forEach(function(key) {
			this._spec[key] = spec[key];
		}, this);
	};

	Request.prototype.open = function(method, url, async) {
		var err = compare(this._spec.method, method, 'wrong method');
		err = err || compare(this._spec.url, url, 'wrong url');
		this._opened = true;
		return err;
	};

	Request.prototype.send = function(body) {
		if(this._opened !== true) {
			return new Error('#open has to be called first');
		}
		var err = compare(this._spec.body, body, 'wrong body');
		err = err || compare(this._spec.headers, this._headers, 'wrong headers');
		this.responseText = this._spec.response;
		return err;
	};

	Request.prototype.setRequestHeader = function(key, value) {
		this._headers[key] = value;
	};
	
	Hyacinth.Request = Request;
	Hyacinth.version = '0.0.1-dev';
})();
