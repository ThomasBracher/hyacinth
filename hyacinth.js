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
		} else {
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
		FakeRequest.oncreate.call(null, this);
	}

	FakeRequest.prototype = Object.create(EventTarget.prototype);

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
			this.onreadystatechange.call(this);
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

	FakeRequest.OPENED = 1;
	FakeRequest.HEADERS_RECEIVED = 2;
	FakeRequest.LOADING = 3;
	FakeRequest.DONE = 4;

	hyacinth.EventTarget = EventTarget;
	hyacinth.Event = Event;
	hyacinth.FakeXMLHttpRequest = FakeRequest;
	hyacinth.version = '0.0.1-dev';
})();
