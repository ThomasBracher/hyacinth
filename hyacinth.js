(function() {
	"use strict";

	var hyacinth = window.hyacinth = window.hyacinth || {};

	function Event(name) {
		this.type = name;
	}

	Event.prototype.preventDefault = function() {
		this.defaultPrevented = true;
	};

	function EventTarget() {
		this.listeners = {};
	}

	EventTarget.prototype.addEventListener = function(name, listener) {
		this.listeners[name] = this.listeners[name] || [];
		if(typeof listener === 'function') {
			this.listeners[name].push(listener);
		} else if(typeof listener.handleEvent === 'function') {
			this.listeners[name].push(listener.handleEvent.bind(listener));
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
			listener.call(this, e);
		}, this);
		return !!e.defaultPrevented;
	};

	function FakeRequest() {
		EventTarget.apply(this);
		this.readyState = 0;
		if(typeof FakeRequest.oncreate === 'function') {
			FakeRequest.oncreate.call(null, this);
		}
	}

	FakeRequest.prototype = Object.create(EventTarget.prototype, {
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
		if(typeof this.onreadystatechange === 'function') {
			try {
				this.onreadystatechange.call(this);
			} catch(e) {
			}
		}
		this.dispatchEvent(new Event('readystatechange'));
	};

	FakeRequest.prototype.open = function(method, url, async, user, password) {
		this.method = method;
		this.url = url;
		this.setAsync(async);
		this.user = user;
		this.password = password;

		this.responseText = null;
		this.sendFlag = false;
		this.setReadyState(FakeRequest.OPENED);
		this.requestHeaders = {};
	};

	var unsafeHeaders = {
		'Accept-Charset': true,
		'Accept-Encoding': true,
		'Connection': true,
		'Content-Length': true,
		'Cookie': true,
		'Cookie2': true,
		'Content-Transfer-Encoding': true,
		'Date': true,
		'Expect': true,
		'Host': true,
		'Keep-Alive': true,
		'Referer': true,
		'TE': true,
		'Transfer-Encoding': true,
		'Upgrade': true,
		'User-Agent': true,
		'Via': true,
		'Proxy-Oops': true,
		'Sec-Oops': true,
	};

	FakeRequest.prototype.openedAndNotSend = function() {
		if(this.readyState !== FakeRequest.OPENED) {
			throw new Error('readyState should be OPENED');
		} else if(this.sendFlag === true) {
			throw new Error('request should not be send');
		}
	};

	FakeRequest.prototype.shouldRegisterHeader = function(header) {
		this.openedAndNotSend();
		if(unsafeHeaders[header] === true) {
			throw new Error(header + ' is unsafe');
		}
	};

	FakeRequest.prototype.setRequestHeader = function(header, value) {
		this.shouldRegisterHeader(header);
		if(this.requestHeaders[header] === undefined) {
			this.requestHeaders[header] = value;
		} else {
			this.requestHeaders[header] += ',' + value;
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
		return '';
	};

	FakeRequest.OPENED = 1;
	FakeRequest.HEADERS_RECEIVED = 2;
	FakeRequest.LOADING = 3;
	FakeRequest.DONE = 4;

	hyacinth.EventTarget = EventTarget;
	hyacinth.Event = Event;
	hyacinth.FakeXMLHttpRequest = FakeRequest;
	hyacinth.version = '0.0.1-dev';
})();
