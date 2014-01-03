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
		this.readyState = 0;
		this.status = 200;
		this._spec = {
			async: true,
			method: 'GET',
			url: '',
			headers: {},
			response: {}
		};
		this._headers = {};
		this._async = true;
		Object.keys(spec || {}).forEach(function(key) {
			this._spec[key] = spec[key];
		}, this);
	};

	var changeReadyState = function(_this, newState) {
		_this.readyState = newState;
		if(typeof _this.onreadystatechange === 'function') {
			_this.onreadystatechange.call(_this);
		}
	};

	Request.prototype.open = function(method, url, async) {
		var err = compare(this._spec.method, method, 'wrong method');
		err = err || compare(this._spec.url, url, 'wrong url');
		this._opened = true;
		this._async = async;
		changeReadyState(this, 1);
		return err;
	};

	Request.prototype.send = function(body) {
		if(this._opened !== true) {
			return new Error('#open has to be called first');
		}
		var err = compare(this._spec.body, body, 'wrong body');
		err = err || compare(this._spec.headers, this._headers, 'wrong headers');
		if(!this._async) {
			this.responseText = this._spec.response.body;
		}
		return err;
	};

	Request.prototype.complete = function() {
		changeReadyState(this, 2);
		this.responseText = '';
		changeReadyState(this, 3);
		this.responseText = this._spec.response.body;
		changeReadyState(this, 4);
	};

	Request.prototype.setRequestHeader = function(key, value) {
		this._headers[key] = value;
	};

	Request.prototype.getResponseHeader = function(key) {
		if(this.readyState >= 2) {
			if(this._spec.response.headers[key]) {
				return this._spec.response.headers[key];
			} else {
				return null;
			}
		} else {
			return null;
		}
	};

	Request.prototype.getAllResponseHeaders = function() {
		var headers = Object.keys(this._spec.response.headers).map(function(key) {
			return key + ': ' + this._spec.response.headers[key] + '\n';
		}, this);
		return headers.join('');
	};
	
	Hyacinth.Request = Request;
	Hyacinth.version = '0.0.1-dev';
})();
