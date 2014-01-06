(function() {
	"use strict";

	var hyacinth = window.hyacinth = window.hyacinth || {};

	function Event(name) {
		this.type = name;
	}

	Event.prototype.preventDefault = function() {
		this.defaultPrevented = true;
	};

	var progressEvent = function(total, loaded) {
		var e = new Event('progress');
		e.total = total;
		e.loaded = loaded;
		return e;
	};

	function EventTarget() {
		this.listeners = {};
	}

	EventTarget.prototype.addEventListener = function(name, listener) {
		this.listeners[name] = this.listeners[name] || [];
		if(typeof listener === 'function' || typeof listener.handleEvent === 'function') {
			this.listeners[name].push(listener);
		}
	};

	EventTarget.prototype.removeEventListener = function(name, listener) {
		var listeners = this.listeners[name] || [];
		var index = listeners.indexOf(listener);
		return listeners.splice(index, 1);
	};

	EventTarget.prototype.dispatchEvent = function(e) {
		var listeners = this.listeners[e.type] || [];
		listeners.forEach(function(listener) {
			if(typeof listener === 'function') {
				listener.call(this, e);
			} else {
				listener.handleEvent.call(listener, e);
			}
		}, this);
		if(typeof this['on' + e.type] === 'function') {
			this['on' + e.type].call(this, e);
		}
		return !!e.defaultPrevented;
	};

	function XHREventTarget() {
		EventTarget.apply(this);
		var events = [ 'abort', 'error', 'load', 'loadend', 'loadstart', 'progress', 'timeout' ];
		events.forEach(function(event) {
			this['on' + event] = null;
		}, this);
	}

	XHREventTarget.prototype = Object.create(EventTarget.prototype, {
		constructor: {
			value: XHREventTarget,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});

	function FakeRequest() {
		XHREventTarget.apply(this);
		this.onreadystatechange = null;
		this.sendFlag = false;
		this.errorFlag = false;
		this.async = false;
		this.uploadComplete = false;
		this.uploadEvents = false;
		this.requestHeaders = {};
		this.requestBody = null;
		this.readyState = FakeRequest.UNSENT;
		this.responseXML = null;
		this.status = 0;
		this.upload = new EventTarget();
		if(typeof FakeRequest.oncreate === 'function') {
			FakeRequest.oncreate.call(null, this);
		}
	}

	FakeRequest.prototype = Object.create(XHREventTarget.prototype, {
		constructor: {
			value: FakeRequest,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});

	FakeRequest.prototype.setAsync = function(async) {
		if(async === undefined) {
			this.async = true;
		} else {
			this.async = async;
		}
	};

	FakeRequest.prototype.setReadyState = function(state) {
		this.readyState = state;
		this.dispatchEvent(new Event('readystatechange'));
		if(state === FakeRequest.DONE) {
			this.upload.dispatchEvent(new Event('load'));
			this.upload.dispatchEvent(progressEvent(100, 100));
		}
	};

	FakeRequest.prototype.open = function(method, url, async, user, password) {
		var methods = /connect|delete|get|head|options|post|put|trace|track/i;
		if(method.match(methods)) {
			this.method = method.toUpperCase();
		} else {
			this.method = method;
		}
		if(this.method.match(/CONNECT|TRACE|TRACK/)) {
			throw new Error('SecurityError');
		}
		this.url = url;
		this.setAsync(async);
		this.user = user;
		this.password = password;

		this.responseText = null;
		this.sendFlag = false;
		this.requestHeaders = {};
		this.responseEntityBody = null;
		this.setReadyState(FakeRequest.OPENED);
	};

	var unsafeHeaders = {
		'ACCEPT-CHARSET': true,
		'ACCEPT-ENCODING': true,
		'CONNECTION': true,
		'CONTENT-LENGTH': true,
		'COOKIE': true,
		'COOKIE2': true,
		'CONTENT-TRANSFER-ENCODING': true,
		'DATE': true,
		'EXPECT': true,
		'HOST': true,
		'KEEP-ALIVE': true,
		'REFERER': true,
		'TE': true,
		'TRANSFER-ENCODING': true,
		'UPGRADE': true,
		'USER-AGENT': true,
		'VIA': true,
	};

	FakeRequest.prototype.openedAndNotSend = function() {
		if(this.readyState !== FakeRequest.OPENED) {
			throw new Error('InvalidStateError');
		} else if(this.sendFlag === true) {
			throw new Error('InvalidStateError');
		}
	};

	var startWithProxyOrSec = function(header) {
		var reg = /^Proxy\-|^Sec\-/i;
		return reg.test(header);
	};

	FakeRequest.prototype.shouldRegisterHeader = function(header) {
		this.openedAndNotSend();
		if(unsafeHeaders[header.toUpperCase()] === true) {
			throw new Error(header + ' is unsafe');
		} else if(startWithProxyOrSec(header)) {
			throw new Error(header + ' is unsafe');
		}
	};

	FakeRequest.prototype.setRequestHeader = function(header, value) {
		this.shouldRegisterHeader(header);
		if(this.requestHeaders[header] === undefined) {
			this.requestHeaders[header] = value;
		} else {
			this.requestHeaders[header] += ', ' + value;
		}
	};

	FakeRequest.prototype.defaultMimeIfNone = function() {
		if(!this.requestHeaders['Content-Type']) {
			this.requestHeaders['Content-Type'] = 'text/plain';
		}
		this.requestHeaders['Content-Type'] += ';charset=utf-8';
	};

	FakeRequest.prototype.setRequestBody = function(body) {
		if(this.method === 'POST') {
			this.requestBody = body;
		} else {
			this.requestBody = null;
		}
	};

	FakeRequest.prototype.send = function(data) {
		this.openedAndNotSend();
		this.defaultMimeIfNone();
		this.setRequestBody(data);
		this.errorFlag = false;
		if(this.async) {
			this.sendFlag = true;
		}
		this.setReadyState(FakeRequest.OPENED);
		if(typeof this.onSend === 'function') {
			this.onSend.call(this, this);
		}
	};

	FakeRequest.prototype.abort = function() {
		this.aborted = true;
		this.responseText = null;
		this.errorFlag = true;
		this.requestHeaders = {};

		if(this.readyState > FakeRequest.UNSENT && this.sendFlag) {
			this.setReadyState(FakeRequest.DONE);
			this.sendFlag = false;
		}

		this.readyState = FakeRequest.UNSENT;

		if(typeof this.onerror === 'function') {
			this.onerror.call(this);
		}
		this.upload.dispatchEvent(new Event('abort'));
	};

	FakeRequest.prototype.setResponseHeaders = function(headers) {
		this.responseHeaders = headers;
		if(this.async) {
			this.setReadyState(FakeRequest.HEADERS_RECEIVED);
		}
		this.readyState = FakeRequest.HEADERS_RECEIVED;
	};

	FakeRequest.prototype.assertOpenAndHeadersReceived = function() {
		if(this.readyState < FakeRequest.HEADERS_RECEIVED) {
			throw new Error('xhr should be opened and headers received');
		}
	};

	FakeRequest.prototype.responseNotSent = function() {
		if(this.readyState >= FakeRequest.LOADING) {
			throw new Error('xhr should not already been done');
		}
	};

	var verifyResponseBodyType = function(body) {
		if(typeof body !== 'string') {
			throw new Error('body should be a string');
		}
	};

	FakeRequest.prototype.setResponseBody = function(body) {
		this.assertOpenAndHeadersReceived();
		this.responseNotSent();
		verifyResponseBodyType(body);
		var chunksize = this.chunkSize || 10;
		this.responseText = '';

		while(this.responseText.length < body.length) {
			if(this.async) {
				this.setReadyState(FakeRequest.LOADING);
			}
			this.responseText += body.slice(this.responseText.length, this.responseText.length+ chunksize);
		}

		if(this.responseText !== '') {
			var parser = new DOMParser();
			this.responseXML = parser.parseFromString(this.responseText, this.getResponseHeader('Content-Type') || 'text/xml');
		}

		if(this.async) {
			this.setReadyState(FakeRequest.DONE);
		} else {
			this.readyState = FakeRequest.DONE;
		}
	};

	var statusTexts = {
		100: "Continue",
		101: "Switching Protocols",
		200: "OK",
		201: "Created",
		202: "Accepted",
		203: "Non-Authoritative Information",
		204: "No Content",
		205: "Reset Content",
		206: "Partial Content",
		300: "Multiple Choice",
		301: "Moved Permanently",
		302: "Found",
		303: "See Other",
		304: "Not Modified",
		305: "Use Proxy",
		307: "Temporary Redirect",
		400: "Bad Request",
		401: "Unauthorized",
		402: "Payment Required",
		403: "Forbidden",
		404: "Not Found",
		405: "Method Not Allowed",
		406: "Not Acceptable",
		407: "Proxy Authentication Required",
		408: "Request Timeout",
		409: "Conflict",
		410: "Gone",
		411: "Length Required",
		412: "Precondition Failed",
		413: "Request Entity Too Large",
		414: "Request-URI Too Long",
		415: "Unsupported Media Type",
		416: "Requested Range Not Satisfiable",
		417: "Expectation Failed",
		422: "Unprocessable Entity",
		500: "Internal Server Error",
		501: "Not Implemented",
		502: "Bad Gateway",
		503: "Service Unavailable",
		504: "Gateway Timeout",
		505: "HTTP Version Not Supported"
	};

	FakeRequest.prototype.respond = function(status, headers, body) {
		this.status = status || 200;
		this.statusText = statusTexts[status];
		this.setResponseHeaders(headers);
		this.setResponseBody(body || '');
	};

	FakeRequest.prototype.getResponseHeader = function(header) {
		if(this.readyState < FakeRequest.HEADERS_RECEIVED) {
			return null;
		} else {
			header = header.toLowerCase();
			var headers = {};
			Object.keys(this.responseHeaders).forEach(function(key) {
				headers[key.toLowerCase()] = this.responseHeaders[key];
			}, this);
			return headers[header] || null;
		}
	};

	FakeRequest.prototype.getAllResponseHeaders = function() {
		if(this.readyState < FakeRequest.HEADERS_RECEIVED){
			return null;
		}
		var inlineArray = Object.keys(this.responseHeaders || {}).map(function(header) {
			return header + ': ' + this.responseHeaders[header] + '\r\n';
		}, this);
		return inlineArray.join('');
	};

	FakeRequest.prototype.uploadProgress = function(spec) {
		this.upload.dispatchEvent(progressEvent(spec.total, spec.loaded));
	};

	FakeRequest.prototype.uploadError = function(err) {
		var e = new Event('error');
		e.detail = err;
		this.upload.dispatchEvent(e);
	};

	FakeRequest.UNSENT = 0;
	FakeRequest.OPENED = 1;
	FakeRequest.HEADERS_RECEIVED = 2;
	FakeRequest.LOADING = 3;
	FakeRequest.DONE = 4;

	hyacinth.EventTarget = EventTarget;
	hyacinth.Event = Event;
	hyacinth.XHREventTarget = XHREventTarget;
	hyacinth.FakeXMLHttpRequest = FakeRequest;
	hyacinth.version = '0.0.1-dev';
})();
