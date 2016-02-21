# Hyacinth, the http mock on browser side
[![Build Status](https://travis-ci.org/ThomasBracher/hyacinth.svg?branch=master)](https://travis-ci.org/ThomasBracher/hyacinth)


## Forewords
There is not much http mocking on the browser side and those existing are low-level or tied to a library. The goal of hyacinth is to create a high level http mock with no dependence to jQuery or another library. You will still need to work with a test framework.

## Installation
Hyacinth is only available with npm for now:
```
npm install hyacinth-js --save-dev
```

## Getting Started
The core of Hyacinth is `hyacinth.Server`. It carries the expectations and responds in place of the original XMLHttpRequest.

```javascript
var server = new hyacinth.Server();

// Set up the expectations (explained below)

server.launch(); // replace the global.XMLHttpRequest with a fake

// Execute the http requests

server.shutdown(); // empty the expectations and bring the vanilla XMLHttpRequest back
```

### Setting up expectations

server has a high level api inspired by [connect](http://www.senchalabs.org/connect). There is a method for every http method, let's see how to make a GET request.

```javascript
server.get('/hello', function(req, res) {
	res.send('world');
});
```

As you might have guest, by making a GET request on /hello url, the fake server will respond to you with a world text response. req and res are respectively instance of Response and Request attached to the underlying fake XMLHttpRequest.

## Documentation

### Server

This is the constructor of the server

```javascript
var server = new hyacinth.Server();
```

#### launch()

It saves the current global XMLHttpRequest by a interceptor. It does not affect expectations. They can be declared before or after the server is launched, they will be registered still.

#### shutdown()

It replaces the fake XMLHttpRequest setted by `server.launch` by the original one. It also erases every expectation registered.

#### verb(url, handler)

_verb_ has to be replace with one of the following:
* get
* post
* put
* delete
* head
* options

It register a handler to any request using the _verb_ http method and to the url.
* url can be either a string or a regexp. If you want more url filtering, see Request object below.
* handler is a function with two parameter: `function(req, res)` req and res being respectively a Request and a Response instance.

### Request

#### body([type])

You can parse the body of the request with the type. type can be one of these:
* json
* that's it for now

If you want the raw body just call `body()`.

#### getHeader(header)

Returns the header's value in the request.

#### url  _property_

Returns the url passed to complete the handler. It should be useful for parsing it and returning query string or else.

### Response

#### send([status | body], [body])

This function is used to respond to the incoming request. You can simply use it as a confirmation by specifying nothing `res.send()`. It will by default send a 200 OK response with an empty body. Only specifying the body will send a 200 OK response with the body described. It will otherwise send the specified request.
All headers or else specified before will be send with the response.

#### json([status | object], [object])

This utility does the same as `res.send(status, body)` except that it will set up the XMLHttpRequest and the Content-Type header to simulate a json response. It does exactly the same as `send()`.

#### setHeader(header, value)

Sets the value of the specified header. Headers are sent with `send()` or `json()` methods.

## License
The MIT License (MIT)

Copyright (c) 2014 Thomas Bracher

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
