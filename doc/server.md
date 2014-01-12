# Hyacinth

## Exemple

lets do the most basic thing, trying to de a GET on the root path '/' of the server. The server should only send a response containing 'hello'.
````
var server = new Server();

server.get('/', function(req, res) {
	res.send(200);
});
`````
