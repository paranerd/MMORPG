let util = require("util"), // Utility resources (logging, object inspection, etc)
	express = require('express'),
	app = express(),
	port = 8000,
	io = require('socket.io').listen(app.listen(port)),
	MongoClient = require('mongodb').MongoClient,
	Player = require("./Player").Player, // Player class
	Enemy = require("./Enemy").Enemy, // Enemy class
	Level = require("./Level").Level,
	Item = require("./Item").Item, // Player class
	Npc = require("./Npc").Npc,
	mongoUrl = 'mongodb://localhost:27017/mmorpg',
	dbConnection,
	db,
	quests = require("./questlist").questlist,
	socket, // socket controller
	players = [], // connected players
	enemies = [],
	npcs = [],
	items = [],
	world, // map to draw
	collisionMap = [],
	worldSize,
	tileSize;

app.use(express.static(__dirname + '/public'));

MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, client) {
	if (err) throw err;

	dbConnection = client;
	db = client.db('mmorpg');

	//client.close();
});

function init() {
	// Initialize the world array
	world = Level.getMap(1);
	worldSize = Level.getWorldSize();
	tileSize = Level.getTileSize();

	// Create empty collision map and init enemy array
	let enemyID = 0;
	for (var x = 0; x < worldSize; x++) {
		collisionMap[x] = [];
		for (var y = 0; y < worldSize; y++) {
			if (world[x][y] == 0) {
				collisionMap[x][y] = 0;
			}
			else if (world[x][y] == 1) {
				collisionMap[x][y] = 1;
				var newEnemy = new Enemy(x * tileSize, y * tileSize, enemyID, 20);
				enemies.push(newEnemy);
				enemyID++;
			}
			else {
				collisionMap[x][y] = 3;
			}
		}
	}

	// Init npc array
	var npcList = Level.getNpcList();

	// Fill collision map
	for (var i = 0; i < npcList.length; i += 1) {
		var newNpc = new Npc(npcList[i].id, npcList[i].x * tileSize, npcList[i].y * tileSize, npcList[i].name, npcList[i].questID);
		npcs.push(newNpc);
		collisionMap[npcList[i].x][npcList[i].y] = 2;
	}

	setEventHandlers();
};

// Game event handlers
var setEventHandlers = function() {
	io.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("Player connected: " + client.id);

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("player connected", onPlayerConnect);

	// Listen for player updates
	client.on("update player", onUpdatePlayer);

	// Listen for new messages
	client.on("new message", onNewMessage);

	// Listen for logout
	client.on("logout", onLogout);

	// Player going to fight
	client.on("start fight", onStartFight);

	// Player ended fight
	client.on("abort fight", onAbortFight);
};

function onPlayerConnect(data) {
	var toClient = this;
	if (!data.name) {
		toClient.emit("no player");
	}
	db.collection('users').findOne( { name: data.name }, function(err, savedUser) {
		if (err || !savedUser) {
			toClient.emit("no player");

			var player = new Player(128, 192, data.name, 100);
			db.collection('users').insertOne(player, function(err2, savedUser2) {
				if (err2 || !savedUser2) {
					// Error occurred
				}
				else {
					// User saved
				}
			});
		}
		else {
			toClient.emit("validated");
			joinPlayer(toClient, data.name);
		}
	});
};

function joinPlayer(client, name) {
	// Send world-data to client
	client.emit("init map", {world: world, tileSize: tileSize, worldSize: worldSize});

	// Send existing enemies to client
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].alive) {
			client.emit("update enemy", {enemy: enemies[i]});
		}
	}

	// Send available quests to client
	for (var i = 0; i < quests.length; i++) {
		client.emit("update quest", quests[i]);
	}

	// Send existing items to client
	for (var i = 0; i < items.length; i++) {
		client.emit("new item", items[i]);
	}

	// Send existing npcs to client
	for (var i = 0; i < npcs.length; i++) {
		var npc = npcs[i];
		client.emit("new npc", npc);
	}

	client.emit("init collisionMap", collisionMap);

	var player = playerByName(name);

	// New Localplayer
	if (!player) {
		for (var i = 0; i < players.length; i++) {
			client.emit("update player", players[i]);
		};

		// Create a new player
		player = new Player(320, 128, name, 100, client.id);

		// Add new player to the players array
		players.push(player);

		// Broadcast new player to connected socket clients
		client.broadcast.emit("update player", player);
		client.broadcast.emit("new message", {player: name, text: "joined the game", mode: "s"});
	}
	// Existing Localplayer
	else {
		// Update the old ID
		var oldID = player.id;

		for (var j = 0; j < players.length; j++) {
			if (players[j].id == oldID) {
				players[j].id = client.id;
			}
			else {
				client.broadcast.emit("update player", players[j]);
			}
		};
	}
	client.emit("create localplayer", player);
};

function onStartFight(data) {
	var player = playerById(data.id);

	if (player) {
		player.setGoFight(data.enemyID);
	}
};

function onAbortFight(data) {
	var player = playerById(data.id);

	if (player) {
		player.stopFight();
	}
}

var calculateDamage = function(att, def) {
	// Math.random() * (max - min + 1) + min;
	var damage = Math.floor((Math.random()*((att - def) - (att - def - 8))) + (att - def - 8));
	if (damage < 0) damage = 0;
	return damage;
}

var fightLoop = setInterval(function() {
	for (i = 0; i < enemies.length; i++) {
		if (enemies[i].readyToHit()) {
			var player = playerById(enemies[i].fightingAgainst());

			if (!player) {
				continue;
			}

			player.getHurt(enemies[i].strength);
			enemies[i].setLastStrike(Date.now());

			if (!player.alive) {
				enemies[i].killedPlayer(player.id);
			}
			io.sockets.emit("player hurt", {id: player.id, amount: enemies[i].strength});
			io.sockets.emit("update player", player);
		}

		else if (!enemies[i].alive && (Date.now() - enemies[i].killTime > enemies[i].respawnTime)) {
			// If player stands on the tile, don't respawn yet (first is for passing tile, second - after || - is for right on the tile
				for (var j = 0; j < players.length; j++) {
				if ((players[j].pos.x > enemies[i].x && players[j].pos.x < enemies[i].x + 32 &&
					players[j].pos.y > enemies[i].y && players[j].pos.y < enemies[i].y + 32) ||
					(players[j].pos.x == enemies[i].x && players[j].pos.y == enemies[i].y))
				{
					break;
				}
			}

			enemies[i].setAlive();
			io.sockets.emit("update enemy", {enemy: enemies[i]});
			world[enemies[i].x / 32][enemies[i].y / 32] = 1;

			var item = getItem(enemies[i].x, enemies[i].y);
			if (item) {
				io.sockets.emit("update item", {item: item, remove: true});
				removeItem(enemies[i].x, enemies[i].y);
			}
		}
	}

	for (var j = 0; j < players.length; j++) {
		var enemyID = players[j].fighting;

		if (players[j].readyToHit() && enemies[enemyID]) {
			var enemy = enemies[enemyID];
			var tileX = enemy.x / 32;
			var tileY = enemy.y / 32;
			players[j].setLastStrike(Date.now());
			var damage = calculateDamage(players[j].strength, enemy.def);
			enemy.getHurt(damage);

			io.sockets.emit("update enemy", {enemy: enemy, amount: damage});
			if (!enemy.alive) {
				world[tileX][tileY] = 0;

				players[j].stopFight();
				dropItem(tileX * 32, tileY * 32);
				break;
			}
		}
	}
}, 16);

function onLogout(data) {
	var player = playerById(this.id);

	if (!player) {
		return;
	}

	this.broadcast.emit("new message", {player: player.name, text: "left the game", mode: "s"});
	players.splice(this.id, 1);
	this.broadcast.emit("remove player", {id: this.id});
};

// Socket client has disconnected
function onClientDisconnect(data) {
	util.log("disconnect: " + this.id);
	//this.emit("disconnect");
};

function onUpdatePlayer(data) {
	var player = playerById(this.id);

	// Player not found
	if (!player) {
		return;
	};

	// Update player position
	player.pos.x = data.x;
	player.pos.y = data.y;
	player.dir = data.dir;

	// Check if player stepped on an item
	var item = getItem(player.pos.x, player.pos.y);
	if (item) {
		io.sockets.emit("update item", {item: item, remove: true}); // TO-DO: only player who got the item should be informed
		io.sockets.emit("get item", {item: item, quantity: item.quantity});
		player.takeItem(item.type, item.quantity);
		removeItem(player.pos.x, player.pos.y);
	}

	// Broadcast updated position to connected socket clients
	this.broadcast.emit("update player", player);

	if (data.enemyID != null) {
		player.fighting = data.enemyID;
		enemies[data.enemyID].startFight(data.id);
	}
}

/*var gameLoop = setInterval(function() {
	for (var i = 0; i < players.length; i++) {
		io.sockets.emit("update player", {player: players[i]});
	}
}, 16);*/

function dropItem(x, y) {
	var chance = Math.round(Math.random() * 100);

	if (chance < 100) {
		var id = (chance < 40) ? 11 : 10;
		var quantity = (id == 11 && chance < 40) ? 20 : null;

		var item = new Item(Date.now(), id, x, y, quantity);
		items.push(item);
		io.sockets.emit("update item", {item: item});
	}
};

function getItem(x, y) {
	for (var i = 0; i < items.length; i++) {
		if (items[i].x == x && items[i].y == y) {
			return items[i];
		}
	}
	return false;
};

function removeItem(x, y) {
	for (var i = 0; i < items.length; i++) {
		if (items[i].x == x && items[i].y == y) {
			items.splice(i, 1);
			break;
		}
	}
};

function onNewMessage(data) {
	var player = playerById(this.id);
	if (data.chatTo) {
		var chatTo = playerByName(data.chatTo);
		if (data.mode == "w" && chatTo) {
			io.to(chatTo.id).emit("new message", {player: player.name, text: data.text, mode: data.mode});
		}
		else if (!chatTo) {
			this.emit("new message", {player: data.chatTo, text: "Player " + data.chatTo + " doesn't exist!", mode: "s"});
		}
	}
	else {
		io.sockets.emit("new message", {player: player.name, text: data.text, mode: data.mode});
	}
}


// Helper
function playerById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	}

	return false;
}

function playerByName(name) {
	for (var j = 0; j < players.length; j++) {
		if (players[j].name == name) {
			return players[j];
		}
	};
	return false;
};

// Run the game
init();

/*****************************************
 * NOTES
 *****************************************

$ sudo apt-get install mongodb
$ sudo npm install mongojs
Dann, um auf die DB zuzugreifen:
mongo mongoapp
Commands für darin (die collection "users" wird oben beim connect schon erstellt):
show collections - zeigt alle collections in der DB
db.users.find() - listet alle Dokumente in der DB auf
db.users.drop() - löscht die collection
db.users.findOne( { playerName: data.playerName } ) - durchsucht alle Dokumente nach dem value
db.users.ensureIndex({id:1}, {unique : true}); - sorgt dafür, dass jede ID nur einmal vorkommt */
