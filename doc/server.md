# hyacinth

## Exemple

lets do the most basic thing, trying to de a GET on the root path '/' of the server. The server should only send a response containing 'hello'.
````
var server = new hyacinth.Server();

server.get('/', function(req, res) {
	res.send(200, 'hello');
});
````

Once the server is setted up, you launch it and it will change the global XMLHttpRequest object to execute the requests just as specified before. When done, you can restore XMLHttpRequest by calling shutdown.

````
server.launch();

// Do the request and let hyacinth respond ...

server.shutdown();
````
