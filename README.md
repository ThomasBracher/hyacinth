# Hyacinth, the http mock on browser side

## Forewords
There is not much http mocking on the browser side and those existing are low-level or tied to a library. The goal of hyacinth is to create a high level http mock with no dependence to jQuery or another library. You will still need to work with a test framework.

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

Documentation still to be written. thx for your patience.

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
