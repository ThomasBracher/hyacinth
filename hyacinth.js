(function() {
	"use strict";

	var hyacinth = window.hyacinth = window.hyacinth || {};
	hyacinth.version = "0.1.0";

	function Event(name) {
		this.type = name;
	}

	Event.prototype.preventDefault = function() {
		this.defaultPrevented = true;
	};

	function EventTarget() {
		this.listeners = {};
	}

	var isListener = function(spec) {
		return typeof spec.handleEvent === 'function';
	};

	var isFunction = function(spec) {
		return typeof spec === 'function';
	};

	function Listener(target, spec) {
		this._origin = spec;
		if(isListener(spec)) {
			this.handleEvent = function() {
				spec.handleEvent.apply(spec, arguments);
			};
		} else if(isFunction(spec)) {
			this.handleEvent = function() {
				spec.apply(target, arguments);
			};
		}
	}

	EventTarget.prototype.convertListener = function(listener) {
		return new Listener(this, listener);
	};

	EventTarget.prototype.addEventListener = function(name, listener) {
		this.listeners[name] = this.listeners[name] || [];
		this.listeners[name].push(this.convertListener(listener));
	};

	EventTarget.prototype.removeEventListener = function(name, listener) {
		var listeners = this.listeners[name] || [];
		var origins = listeners.map(function(listener) {
			return listener._origin;
		});
		var index = origins.indexOf(listener);
		return listeners.splice(index, 1);
	};

	EventTarget.prototype.dispatchEventForListeners = function(e) {
		var listeners = this.listeners[e.type] || [];
		listeners.forEach(function(listener) {
			listener.handleEvent.call(this, e);
		}, this);
	};

	EventTarget.prototype.dispatchEventForProperties = function(e) {
		if(typeof this['on' + e.type] === 'function') {
			this['on' + e.type].call(this, e);
		}
	};

	EventTarget.prototype.dispatchEvent = function(e) {
		this.dispatchEventForListeners(e);
		this.dispatchEventForProperties(e);
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
		this.async = true;
		this.uploadComplete = false;
		this.uploadEvents = false;
		this.requestHeaders = {};
		this.requestBody = null;
		this.timeout = 0;
		this.readyState = FakeRequest.UNSENT;
		this.responseXML = null;
		this.status = 0;
		this.statusText = '';
		this.upload = new XHREventTarget();
		this.response = null;
		Object.defineProperty(this, 'responseType', {
			enumerable: true,
			set: function() {
				if(this.readyState === FakeRequest.DONE || this.readyState === FakeRequest.LOADING) {
					throw new Error('InvalidStateError');
				} else if(this.async === false) {
					throw new Error('InvalidAccessError');
				}
				this._responseType = arguments[0];
			},
			get: function() {
				return this._responseType || '';
			}
		});
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
		if(async === false) {
			if(this.timeout !== 0) {
				throw new Error('InvalidAccessError');
			}
			Object.defineProperty(this, 'timeout', {
				configurable: false,
				enumerable: true,
				set: function() {
					throw new Error('InvalidAccessError');
				},
				get: function() {
					return 0;
				}
			});
		}
		if(async === undefined) {
			this.async = true;
		} else {
			this.async = async;
		}
	};

	FakeRequest.prototype.setReadyState = function(state) {
		this.readyState = state;
		this.dispatchEvent(new Event('readystatechange'));
	};

	FakeRequest.prototype.setMethod = function(method) {
		var methods = /connect|delete|get|head|options|post|put|trace|track/i;
		if(method.match(methods)) {
			this.method = method.toUpperCase();
		} else {
			this.method = method;
		}
		if(this.method.match(/CONNECT|TRACE|TRACK/)) {
			throw new Error('SecurityError');
		}
	};

	FakeRequest.prototype.open = function(method, url, async, user, password) {
		this.setMethod(method);
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

	FakeRequest.prototype.setMimeAndEncoding = function() {
		if(!this.requestHeaders['Content-Type']) {
			this.requestHeaders['Content-Type'] = 'text/plain; charset=utf-8';
		} else {
			var content = this.requestHeaders['Content-Type'];
			var matcher = /(?:charset=)(\w*)/i;
			var charset = matcher.exec(content);
			var utf = /utf\-8/i;
			if(charset && !charset[1].match(utf)) {
				this.requestHeaders['Content-Type'] = content.replace(charset[1], 'utf-8');
			} else {
				this.requestHeaders['Content-Type'] += '; charset=utf-8';
			}
		}
	};

	FakeRequest.prototype.setRequestBody = function(body) {
		if(this.method !== 'GET' && this.method !== 'HEAD') {
			this.requestBody = body || null;
		} else {
			this.requestBody = null;
		}
		if(this.requestBody === null) {
			this.uploadComplete = true;
		}
	};

	FakeRequest.prototype.startUpAndDownload = function() {
		this.dispatchEvent(new Event('loadstart'));
		if(this.uploadComplete === false) {
			this.upload.dispatchEvent(new Event('loadstart'));
		}
	};

	FakeRequest.prototype.triggerSentEvent = function() {
		var e = new Event('send');
		e.xhr = this;
		this.dispatchEvent(e);
	};

	FakeRequest.prototype.send = function(data) {
		this.openedAndNotSend();
		this.setMimeAndEncoding();
		this.setRequestBody(data);
		this.errorFlag = false;
		if(this.async) {
			this.sendFlag = true;
		}
		this.setReadyState(FakeRequest.OPENED);
		this.startUpAndDownload();
		this.triggerSentEvent();
	};

	var uploadFinishEvents = function(root, cause) {
		root.dispatchEvent(new Event('progress'));
		root.dispatchEvent(new Event(cause));
		root.dispatchEvent(new Event('loadend'));
	};

	FakeRequest.prototype.completeUpload = function(cause) {
		this.uploadComplete = true;
		uploadFinishEvents(this.upload, cause);
	};

	FakeRequest.prototype.dispatchUploadComplete = function(cause) {
		uploadFinishEvents(this, cause);
		if(this.uploadComplete === false) {
			this.completeUpload(cause);
		}
	};

	FakeRequest.prototype.abort = function() {
		this.errorFlag = true;

		this.status = 0;
		this.statusText = '';
		if(this.responseType === 'text' || this.responseType === '') {
			this.response = '';
		} else {
			this.response = null;
		}

		if(this.async === false && this.readyState === FakeRequest.OPENED) {
			this.readyState = FakeRequest.DONE;
			throw new Error('AbortError');
		}

		this.async = true;

		if(this.sendFlag === true && this.readyState !== FakeRequest.DONE) {
			this.setReadyState(FakeRequest.DONE);
			this.dispatchUploadComplete('abort');
		}
		this.sendFlag = false;
		this.readyState = FakeRequest.UNSENT;
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

	FakeRequest.prototype.setXMLResponse = function() {
		if(this.responseText !== '') {
			var parser = new DOMParser();
			// If final MIME type is not null, text/html, text/xml, application/xml, or does not end in +xml, return null.
			var mimeType = this.getResponseHeader('Content-Type');
			if (mimeType && (mimeType.indexOf('+xml') !== -1 || mimeType == 'text/html' || mimeType == 'application/xml' || mimeType == 'text/xml')) {
				this.responseXML = parser.parseFromString(this.responseText, 'text/html');
			}
		}
	};

	FakeRequest.prototype.setResponse = function() {
		if(this.responseType === 'json') {
			try {
				this.response = JSON.parse(this.responseText);
			} catch(e) {
				this.response = null;
			}
		} else {
			this.response = this.responseText;
		}
	};

	FakeRequest.prototype.setResponseBody = function(body) {
		this.assertOpenAndHeadersReceived();
		this.responseNotSent();
		verifyResponseBodyType(body);
		this.responseText = '';

		if(this.async) {
			this.setReadyState(FakeRequest.LOADING);
		}
		this.responseText = body;

		this.setXMLResponse();
		this.setResponse();

		if(this.async) {
			this.setReadyState(FakeRequest.DONE);
		} else {
			this.readyState = FakeRequest.DONE;
		}
		uploadFinishEvents(this, 'load');
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
		this.completeUpload('load');
		this.status = status || 200;
		this.statusText = statusTexts[status];
		this.setResponseHeaders(headers);
		this.setResponseBody(body || '');
	};

	FakeRequest.prototype.responseAvailable = function() {
		return this.readyState < FakeRequest.HEADERS_RECEIVED || this.errorFlag === true;
	};

	FakeRequest.prototype.getResponseHeader = function(header) {
		if(this.responseAvailable()) {
			return null;
		} else {
			if(/set-cookie2?/i.test(header)) {
				return null;
			}
			header = header.toLowerCase();
			var headers = {};
			Object.keys(this.responseHeaders).forEach(function(key) {
				headers[key.toLowerCase()] = this.responseHeaders[key];
			}, this);
			return headers[header] || null;
		}
	};

	FakeRequest.prototype.getAllResponseHeaders = function() {
		if(this.responseAvailable()) {
			return '';
		}
		var inlineArray = Object.keys(this.responseHeaders || {}).map(function(header) {
			if(/set-cookie2?/i.test(header)) {
				return '';
			} else {
				return header + ': ' + this.responseHeaders[header] + '\r\n';
			}
		}, this);
		return inlineArray.join('');
	};

	FakeRequest.prototype.overrideMimeType = function(mimeType) {
		if(this.readyState === FakeRequest.DONE || this.readyState === FakeRequest.LOADING) {
			throw new Error('InvalidStateError');
		}
		this.mimeType = mimeType;
	};

	FakeRequest.UNSENT = 0;
	FakeRequest.OPENED = 1;
	FakeRequest.HEADERS_RECEIVED = 2;
	FakeRequest.LOADING = 3;
	FakeRequest.DONE = 4;

	function Server() {
		this.expectations = [];
		this._xhrs = [];
	}

	Server.prototype.launch = function() {
		var _this = this;
		this._xhr = window.XMLHttpRequest;
		window.XMLHttpRequest = FakeRequest;
		window.XMLHttpRequest.oncreate = function(xhr) {
			xhr.onsend = function() {
				_this.lookUp(xhr);
			};
			_this._xhrs.push(xhr);
		};
	};

	Server.prototype.shutdown = function() {
		window.XMLHttpRequest = this._xhr;
		this._xhrs = [];
	};

	var verb = function(verb) {
		return function(path, handler) {
			this.expectations.push(new Expectation({
				method: verb,
				url: path,
				handler: handler
			}));
		};
	};

	Server.prototype.verb = verb;

	Server.prototype.get = verb('GET');
	Server.prototype.post = verb('POST');
	Server.prototype.options = verb('OPTIONS');
	Server.prototype.head = verb('HEAD');
	Server.prototype.put = verb('PUT');
	Server.prototype.delete = verb('DELETE');

	function ExpectationsIterator(xhr, collection) {
		this.xhr = xhr;
		this.index = -1;
		this.collection = collection;
		this.req = new Request(xhr);
		this.res = new Response(xhr);
	}

	ExpectationsIterator.prototype.noMoreHandler = function() {
		return this.collection.length <= this.index;
	};

	ExpectationsIterator.prototype.next = function() {
		this.index += 1;
		if(this.noMoreHandler()) {
			var res = new Response(this.xhr);
			res.send(404, 'no Expectation setted for: (' + this.xhr.method + ', "' + this.xhr.url + '")');
		} else {
			var expectation = this.collection[this.index];
			if(expectation.match(this.xhr.method, this.xhr.url)) {
				expectation.handle(this.req, this.res, this.next);
			} else {
				this.next();
			}
		}
	};

	Server.prototype.lookUp = function(xhr) {
		var iterator = new ExpectationsIterator(xhr, this.expectations);
		iterator.next();
	};

	function Expectation(spec) {
		if(!spec.url || !spec.method) {
			throw new Error('MissingArgumentError');
		}
		this.method = spec.method;
		this.url = spec.url;
		this.handler = spec.handler || function() {};
	}

	var urlMatch = function(matcher, url) {
		if(matcher instanceof RegExp) {
			return url.match(matcher);
		} else {
			return url === matcher;
		}
	};

	Expectation.prototype.match = function(method, url) {
		return this.method === method && urlMatch(this.url, url);
	};

	Expectation.prototype.handle = function(req, res, next) {
		this.handler.call(null, req, res, next);
	};

	function Response(xhr) {
		if(arguments[0] === undefined) {
			throw new Error('ArgumentMissingError');
		}
		this.isSend = false;
		this._headers = {};
		this.xhr = xhr;
	}

	Response.prototype.setHeader = function(header, value) {
		this._headers[header] = value;
	};

	Response.prototype.send = function(code, body) {
		var status = code || 200;
		var text = body || '';
		if(typeof code === 'string') {
			status = 200;
			text = code;
		}
		this.xhr.respond(status, this._headers, text);
		this.isSend = true;
	};

	Response.prototype.json = function(code, body) {
		var status = code || 200;
		var data = body || '';
		if(typeof body === 'undefined') {
			status = 200;
			data = code;
		}
		this._headers['Content-Type'] = 'application/json';
		this.xhr.responseType = 'json';
		this.xhr.respond(status, this._headers, JSON.stringify(data));
	};

	var parseQuery = function(url) {
		var query = {};
		var queries = url.split('?').slice(1).join('');
		var couples = queries.split('&');
		couples.forEach(function(couple) {
			var split = couple.split('=');
			var key = split.shift();
			if(key === '') {
				return;
			}
			var value = split.shift();
			query[key] = value;
		});
		return query;
	};

	function Request(xhr) {
		if(!xhr) {
			throw new Error('MissingArgumentError');
		}
		this.xhr = xhr;
		this.url = xhr.url || '';
		this.query = parseQuery(this.url);
	}

	Request.prototype.body = function(type) {
		var body = this.xhr.requestBody;
		if(type === 'json') {
			try {
				return JSON.parse(body);
			} catch(e) {
				return null;
			}
		} else if(type === 'xml') {
			var parser = new DOMParser();
			return parser.parseFromString(body, 'text/html');
		} else {
			return body;
		}
	};

	Request.prototype.getHeader = function(header) {
		var headers = this.xhr.requestHeaders;
		var match = Object.keys(headers).filter(function(key) {
			return key.toLowerCase() === header.toLowerCase();
		});
		return headers[match];
	};

	hyacinth.Request = Request;
	hyacinth.Response = Response;
	hyacinth.Server = Server;
	hyacinth.Expectation = Expectation;
	hyacinth.EventTarget = EventTarget;
	hyacinth.Event = Event;
	hyacinth.XHREventTarget = XHREventTarget;
	hyacinth.FakeXMLHttpRequest = FakeRequest;
})();
