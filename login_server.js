/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require("util"),					// Utility resources (logging, object inspection, etc)
	io = require("socket.io").listen(8006),				// Socket.IO
	db = require('mongojs').connect('localhost/mongoapp', ['users']);

function init() {
	// Configure Socket.IO
	io.configure(function() {
		// Only use WebSockets
		io.set("transports", ["websocket"]);

		// Restrict log output
		io.set("log level", 2);
	});

	// Start listening for events
	setEventHandlers();
};

/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	io.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("Player connected: "+client.id);

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("check login", checkLogin);
};

// Socket client has disconnected
function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);
	this.emit("disconnect");
};

var playerFound;
function checkLogin(data) {
	playerFound = false;
	var toClient = this;
	db.users.findOne( { playerName: data.playerName }, function(err, savedUser) {
		if(err || !savedUser) {
			console.log("User not in db");
			/*var player = new Player(128, 192, data.playerName, 100);
			db.users.save(player, function(err2, savedUser2) {
				if(err2 || !savedUser2) {
					console.log("User not saved because of error" + err2);
				}
				else {
					console.log("User saved");
				}
			});*/
		}
		else {
			playerFound = true;
			console.log("User already in db");
		}
		tellClient(toClient, data.playerName);
	});
};

function tellClient(toClient, playerName) {
	console.log("found?"+playerFound);
	toClient.emit("login checked", {found: playerFound, playerName: playerName});
};
init();
