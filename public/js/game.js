/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,		// Canvas DOM element
	bgCanvas,	// Canvas for static background
	ctx,		// Canvas rendering context
	bgCtx,		// Canvas background rendering context
	mapCanvas,
	mapCtx,
	localPlayer,	// Local player
	remotePlayers,	// Remote players
	enemies,	// Contains the enemies
	quests,
	pName,
	items,
	npcs,
	playername,
	playersprite,
	spritesheet,
	itemsprites,
	npcsprite,
	renderMap,		// Contains the map
	collisionWorld,	// Map containing NPCs and enemies, 0 = walkable, 1 = enemy, 2 = enemy, 3 = not walkable
	worldSize,
	tileSize,
	adjustedTileSize,
	showMap = false,
	showQuests = false,
	lastClicked = {x: null, y: null},
	lastMapUpdate = Date.now(),
	socket;		// Socket connection

/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Initialise socket connection
	//socket = io.connect("http://127.0.0.1", {port: 8010, transports: ["websocket"]});
	socket = io.connect('http://localhost:8000');
	//socket = io.connect("http://paranerd.dyndns.org", {port: 8000, transports: ["websocket"]});
	//socket = io.connect("http://192.168.178.27", {port: 8000, transports: ["websocket"]});

	// Start listening for events
	setEventHandlers();
	setGameClickHandler();
};

/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	document.getElementById("message").addEventListener("keydown", localMessage, false);
	document.getElementById("bLogout").addEventListener("mousedown", logout, false);

	$("#mapButton").click(function() {toggleMap()});
	$("#questButton").click(function() {toggleQuests()});

	// Window resize
	window.addEventListener("resize", onResize, false);

	// Socket connection successful
	socket.on("connect", onSocketConnected);

	// Socket disconnection
	socket.on("disconnect", onSocketDisconnect);

	// Player move message received
	socket.on("move player", onMovePlayer);

	// Player removed message received
	socket.on("remove player", onRemovePlayer);

	// New enemy
	socket.on("new enemy", onNewEnemy);

	// New message
	socket.on("new message", onNewMessage);

	socket.on("enemy hurt", onEnemyHurt);

	socket.on("enemy dead", onEnemyDead);

	socket.on("respawn enemy", onRespawnEnemy);

	socket.on("player hurt", onPlayerHurt);

	socket.on("player dead", onPlayerDead);

	socket.on("update world", onUpdateWorld);

	socket.on("new item", onNewItem);

	socket.on("item taken", onItemTaken);

	socket.on("new npc", onNewNpc);

	socket.on("create localplayer", onCreateLocalPlayer);

	socket.on("new remote player", onNewRemotePlayer);

	socket.on("init map", onInitMap);

	socket.on("init collisionMap", onInitCollisionMap);

	socket.on("validated", startGame);

	socket.on("no player", playerNotFound);
};

function startGame() {
	playerName = sessionStorage.playerName;
	console.log("PLAYER: " + playerName);
	$("#pName").html(playerName);

	playersprite = new Image();
	playersprite.src = 'sprites/playersprite.png';
	spritesheet = new Image();
	spritesheet.src = 'sprites/spritesheet.png';
	npcsprite = new Image();
	npcsprite.src = 'sprites/npc.png';

	itemsprites = new Image();
	itemsprites.src = 'sprites/itemsprites.png';

	// Background music
	var bgMusic = new Audio("sounds/bgmusic.ogg");
	//bgMusic.play();

	enemies = [];
	items = [];
	npcs = [];

	quests = new Quests();

	pName = playerName;

	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");
	ctx.globalAlpha = 0.1;

	// Canvas for static background
	bgCanvas = document.getElementById("bgCanvas");
	bgCtx = bgCanvas.getContext("2d");
	bgCtx.globalAlpha = 0.5;

	// Canvas for map
	mapCanvas = document.getElementById("mapCanvas");
	mapCtx = mapCanvas.getContext("2d");

	// Maximise the canvas
	canvas.width = 640; //window.innerWidth;
	canvas.height = 640; //window.innerHeight;
	bgCanvas.width = 1184;
	bgCanvas.height = 1184;

	// Initialise remote players array
	remotePlayers = [];
};

function playerNotFound() {
	window.location = "login.html";
};

function toggleMap() {
	if(!showMap) {
		showMap = true;
		$("#mapCanvas").removeClass("hideClass");
		drawMap();
	}
	else {
		$("#mapCanvas").fadeOut(250);
		showMap = false;
	}
};

function toggleQuests() {
	if(!showQuests) {
		$("#questMenu").html("<h1>Quests</h1></br></br>");
		var quests = localPlayer.playerQuests();
		if(quests.length == 0) {
			$("#questMenu").append("<p>No Quests available</p>");
		}		
		else {
			for(var i = 0; i < quests.length; i += 1) {
				$("#questMenu").append("<p>"+quests[i][9]+": "+quests[i][5]+" / "+quests[i][4]+"</p>");
			}
		}
		showQuests = true;
		$("#questMenu").removeClass("hideClass");
	}
	else {
		showQuests = false;
		$("#questMenu").addClass("hideClass");
	}
};

function onInitCollisionMap(data) {
	collisionMap = data.collisionMap;
};

function onNewNpc(data) {
	var newNpc = new Npc(data.x, data.y, data.id, data.quest, data.questID);
	npcs.push(newNpc);
};

function onInitMap(data) {
	renderMap = data.world;
	worldSize = data.worldSize;
	tileSize = data.tileSize;
	onResize();
};

// Draw Map
function drawMap() {
	var spriteNum = 0;
	mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
	for (var w=0; w < worldSize; w++)
	{
		for (var h=0; h < worldSize; h++)
		{
			spriteNum = renderMap[w][h];

			// Draw it
			mapCtx.drawImage(spritesheet, spriteNum*tileSize, 0, tileSize, tileSize, w*adjustedTileSize, h*adjustedTileSize, adjustedTileSize, adjustedTileSize);
		}
	}
	var absPos = localPlayer.getAbsPos();
	mapCtx.drawImage(playersprite, 88, 0, 44, 44, absPos.absX/32*adjustedTileSize, absPos.absY/32*adjustedTileSize, adjustedTileSize, adjustedTileSize);
	$("#mapCanvas").fadeIn(500);
};

function onItemTaken(data) {
	console.log("Item taken, type: "+data.type);
	if(localPlayer.getID() == data.id) {
		localPlayer.takeItem(data.type, data.change);
		localPlayer.displayStats();
		// Check if player had a collecting quest
		var playerQuests = localPlayer.playerQuests();
		for(var i = 0; i < playerQuests.length; i += 1) {
			if(playerQuests[i][2] == 1 && playerQuests[i][3] == data.type) {
				if(playerQuests[i][5] < playerQuests[i][4]) {
					localPlayer.updateQuest(i, 1);
				}
				if(playerQuests[i][5] >= playerQuests[i][4]) {
					localPlayer.questCompleted(i);
				}
				//break; - auskommentiert, denn wenn es z.B. 2 Kill-Bat-Quests gibt, wird nur die erste geupdated
			}
		}
	}
	for(var i=0; i<items.length; i++) {
		if(items[i][0] == data.x && items[i][1] == data.y) {
			items.splice(i, 1);
			break;
		}
	}
};

function onNewItem(data) {
	var item = [data.x, data.y, data.type];
	items.push(item);
};

function onUpdateWorld(data) {
	renderMap[data.x][data.y] = data.id;
};

function onPlayerHurt(data) {
	if(data.id == localPlayer.getID()) {
		localPlayer.getHurt(data.amount);
		localPlayer.displayStats();
	}
};

function onPlayerDead(data) {

};

function onEnemyHurt(data) {
	enemies[data.enemyID].getHurt(data.amount);
	if(data.enemyID == localPlayer.enemyID()) {
		localPlayer.playSwordSound();
		enemies[data.enemyID].displayStats(ctx);
	}
};

var tellCounter = 0;
function onEnemyDead(data) {
	enemies[data.enemyID].killed();
	if(data.enemyID == localPlayer.enemyID()) {
		lastClicked = {x: null, y: null};
		localPlayer.setGoAttack(false);
		localPlayer.addXP(data.xp);
		tellCounter = 0;

		// Check if player had a killing quest
		var playerQuests = localPlayer.playerQuests();
		for(var i = 0; i < playerQuests.length; i += 1) {
			console.log("playerQuests[i][2] = "+playerQuests[i][2]+", playerQuests[i][3] = "+playerQuests[i][3]+", data.type = "+data.type);
			if(playerQuests[i][2] == 0 && playerQuests[i][3] == data.type) {
				if(playerQuests[i][5] < playerQuests[i][4]) {
					localPlayer.updateQuest(i, 1);
				}
				if(playerQuests[i][5] >= playerQuests[i][4]) {
					localPlayer.questCompleted(i);
				}
				//break; - auskommentiert, denn wenn es z.B. 2 Kill-Bat-Quests gibt, wird nur die erste geupdated
			}
		}
	}
	renderMap[data.x][data.y] = data.id;
};

function onNewRemotePlayer(data) {
	// Initialise new remote player
	var newPlayer = new Player(data.absX, data.absY, data.playerName, data.currhp, data.id, "remote");
	newPlayer.setWorldData(tileSize, worldSize);
	console.log(data.id+" connected");

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
};

function onCreateLocalPlayer(data) {
	localPlayer = new Player(data.x, data.y, data.playerName, data.currhp, data.id, "local");
	localPlayer.setDir(data.dir);
	localPlayer.setBgPos(data.canvasXnull, data.canvasYnull);
	localPlayer.setAbsPos(data.absX, data.absY);
	localPlayer.displayStats();
	localPlayer.initInventory();
	localPlayer.setWorldData(tileSize, worldSize);
	initInventory();
	initMap();
	$("#gameContainer").removeClass("hideClass");
	animate();
	console.log("Localplayer created");
};

function initInventory() {
	var inventoryMax = localPlayer.getInventoryMax();

	for(var i = 0; i < inventoryMax; i += 1) {
		$("#inventoryContainer").append('<div id="box'+i+'" class="invBox"></div>');
		$('#box'+i).append('<div id="box'+i+'index" class="invBoxIndex"></div>');
		$('#box'+i).click(function() {
			localPlayer.useItem(this);
		});
	}
	console.log("Inventory initialized");
};

function initMap() {
	// Draw World

	var playerAbs = localPlayer.getAbsPos();

	var worldRight = worldSize * tileSize;
	var worldBottom = worldSize * tileSize;

	var spriteNum = 0;
	for (var w=0; w < worldSize; w++)
	{
		for (var h=0; h < worldSize; h++)
		{
			// Don't draw enemies
			if(renderMap[w][h] == 1) {
				spriteNum = 0;
			}
			else {
				spriteNum = renderMap[w][h];
			}
			bgCtx.drawImage(spritesheet, spriteNum*tileSize, 0, tileSize, tileSize, w*tileSize, h*tileSize, tileSize, tileSize);
		}
	}
	console.log("Map initialized");
};

var sayMode;
var chatTo;
function localMessage(e) {
	if(e.keyCode == 13) {
		if(this.value) {
			var text = this.value;
			if(text.charAt(0) == "#") {
				if(text.charAt(1) == "s") {
					sayMode = "s";
					chatTo = null;
					text = text.substring(3);
				}
				else if(text.charAt(1) == "w") {
					sayMode = "w";
					chatTo = text.substring(3, text.indexOf(' ', 3));
					text = text.substring(text.indexOf(' ', 3));
				}
				else if(text.charAt(1) == "n") {
					sayMode = "n";
					chatTo = null;
					text = text.substring(3);
				}
			}
			socket.emit("new message", {mode: sayMode, text: text, chatTo: chatTo});
			onNewMessage({mode: sayMode, text: text, player: "Ich"});
		}
		$("#message").blur();
	}
}

var chatTxtClr = "#c96";
var pColor = "green";
function onNewMessage(data) {
	if(data.player == "Ich") {
		pColor = "green";
	}
	else {
		pColor = "lightblue";
	}
	switch(data.mode) {
		case "s":
			chatTxtClr = "yellow";
		break;
		case "w":
			chatTxtClr = "lightblue";
		break;
		default:
			chatTxtClr = "#c96";
		break;
	}
	console.log("chatTxtClr: "+chatTxtClr);
	$(".text .mCSB_container").append("<span style='color: "+pColor+";'>"+data.player+": </span>"+"<span style='color: "+chatTxtClr+";'>"+data.text+"</span></br>");
	$(".text").mCustomScrollbar("update");
	$(".text").mCustomScrollbar("scrollTo","bottom");
	$("#message").val('');
}

function logout() {
	socket.emit("logout", {id: localPlayer.getID()});
	console.log("Player "+localPlayer.getID()+" logged out");
	socket.emit("disconnect");
	window.location = "login.html";
}

document.onkeyup = function(e)
{
	if(!$("#message").is(":focus")) {
		// M for map
		if(e.keyCode == 77) {
			toggleMap();
		}
		else if(e.keyCode == 81) {
			toggleQuests();
		}
		// Quick access to the inventory, numbers 1 - 9
		else if(e.keyCode > 48 && e.keyCode < 58) {
			localPlayer.useItem($("#box"+(e.keyCode-48-1)));
		}
		// Show chat-input-prompt on "Return"
		else if(e.keyCode == 13) {
			if($("#input").hasClass("hideClass")) {
				$("#input").removeClass("hideClass");
				$("#message").focus();
			}
			else {
				$("#message").blur();
				$("#input").addClass("hideClass");
			}
		}
	}
}

function getClickedTile(e, bgPos) {
	var x = e.pageX - $("#gameArea").position().left - canvas.offsetLeft;
	var y = e.pageY - $("#gameArea").position().top - canvas.offsetTop;
	x = Math.floor((x - bgPos.x)/tileSize);
	y = Math.floor((y - bgPos.y)/tileSize);
	return {x: x, y: y};
}

function setGameClickHandler() {
$("#gameArea").click(function(e)
{
	var bgPos = localPlayer.getBgPos();
	var tile = getClickedTile(e, bgPos);

	var absPos = localPlayer.getAbsPos();

	// To avoid a bug, where player wouldn't walk anymore, when clicked twice on the same tile
	if(!(tile.x == lastClicked.x && tile.y == lastClicked.y) &&
	!(tile.x*32 == absPos.absX && tile.y*32 == absPos.absY)) {
		lastClicked = tile;
		// Going to talk to NPC
		if(collisionMap[tile.x][tile.y] == 2) {
			lastClicked = {x: null, y: null};
			for(var i = 0; i < npcs.length; i += 1) {
				if(tile.x*32 == npcs[i].getX() && tile.y*32 == npcs[i].getY()) {
					if(npcs[i].hasQuest()) {
						console.log("NPC "+i+" has Quest!")
						var playerQuests = localPlayer.playerQuests();
						var found = false;
						for(var j = 0; j < playerQuests.length; j += 1) {
							if(npcs[i].getQuestID() == playerQuests[j][0]) {
								console.log("QuestID: "+playerQuests[j][0]);
								// Player has NPCs quest
								localPlayer.talkToNPC(quests.getQuestConv(playerQuests[j][0], playerQuests[j][1]));
								if(playerQuests[j][1] == 2 && !playerQuests[j][8]) {
									// Player completed the Quest and wants to be rewarded
									console.log("Player wants to be rewarded for Quest "+j);
									localPlayer.rewardQuest(j);
								}
								found = true;
								break;
							}
						}
						// Player hasn't NPCs quest yet
						if(!found) {
							console.log("New Quest, get conversation: "+npcs[i].getQuestID());
							localPlayer.talkToNPC(quests.getQuestConv(npcs[i].getQuestID(), 0));
							var newQuest = quests.getQuest(npcs[i].getQuestID());
							localPlayer.questConfirmationPending(npcs[i].getQuestID(), 1, newQuest[1], newQuest[2], newQuest[3], 0, newQuest[4], newQuest[5], newQuest[0]);
						}
					}
					else {
						localPlayer.talkToNPC(npcs[i].getConversation(i));
					}
					localPlayer.setGoToNpc(true);
					break;
				}
			}
		}
		// Going to attack enemy
		else if(collisionMap[tile.x][tile.y] == 1) {
			for(var i=0; i<enemies.length; i++) {
				if(enemies[i].isAlive() && tile.x*32 == enemies[i].getX() && tile.y*32 == enemies[i].getY()) {
					localPlayer.setGoAttack(true);
					localPlayer.setEnemyID(i);
					socket.emit("start fight", {id: localPlayer.getID(), enemyID: i});
					break;
				}
			}
			localPlayer.setGoToNpc(false);
		}
		else {
			if(localPlayer.isFighting()) {
	
				localPlayer.setGoAttack(false);
				tellCounter = 0;
				socket.emit("abort fight", {id: localPlayer.getID()});
			}
			localPlayer.setGoToNpc(false);
		}
		localPlayer.setMoveInterrupt(true);

		// Wait for the player to stop at next tile
		var timer = setInterval(function() {
			if(!localPlayer.isMoving()) {
				clearTimeout(timer);
				localPlayer.setMoveInterrupt(false);
				var pathStart = [absPos.absX/tileSize, absPos.absY/tileSize];

				// Calculate path
				var path = Pathfinder(collisionMap, pathStart, tile);
				//console.log("path.length: "+path.length);
				if(path.length > 0) {
					localPlayer.setPath(path);
				}
			}
		}, 1);
	}
})
}

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	//canvas.width = window.innerWidth;
	//canvas.height = window.innerHeight;

		$('#gameArea').css({
			left: ($(window).width() - $('#gameArea').outerWidth())/2,
			top: ($(window).height() - $('#gameArea').outerHeight())/2
		});
		$('#input').css({
			left: ($(window).width() - $('#input').outerWidth())/2,
			top: ($(window).height() - $('#input').outerHeight())/1.2
		});
		$('#questMenu').css({
			left: ($(window).width() - $('#questMenu').outerWidth())/2,
			top: ($(window).height() - $('#questMenu').outerHeight())/2
		});

		$('#confirmation').css({
			left: ($(window).width() - $('#conversation').outerWidth())/2,
		});
		adjustedTileSize = Math.floor(window.innerHeight/worldSize);
		$('#mapCanvas').css({
			left: ($(window).width() - adjustedTileSize * worldSize)/2,
			top: ($(window).height() - adjustedTileSize * worldSize)/2,
			width: adjustedTileSize * worldSize,
			height: adjustedTileSize * worldSize
		});
		$('#conversation').css({
			left: ($(window).width() - $('#conversation').outerWidth())/2,
		});
		mapCanvas.width = adjustedTileSize * worldSize;	
		mapCanvas.height = adjustedTileSize * worldSize;
		if(showMap) {
			drawMap();
		}
};

// Socket connected
function onSocketConnected() {
	// Tell game server client connected
	//socket.emit("player connected", {playerName: pName});
	socket.emit("player connected", {playerName: sessionStorage.playerName});
	console.log(pName+" connected to socket server");
};

// Socket disconnected
function onSocketDisconnect() {
	//window.location = "login.html";
};

// Move player
function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("MovePlayer - Player not found: "+data.id);
		return;
	};
	// Update player position
	movePlayer.setAbsPos(data.x, data.y);
	movePlayer.setDir(data.dir);
};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Player not found
	if (!removePlayer) {
		console.log("RemovePlayer - Player not found: "+data.id);
		return;
	};

	// Remove player from array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

// New Enemy
function onNewEnemy(data) {
	var newEnemy = new Enemy(data.x, data.y, data.id);
	enemies.push(newEnemy);
};

function onRespawnEnemy(data) {
	enemies[data.id].setAlive();
	renderMap[data.x][data.y] = data.type;
};


/**************************************************
** GAME ANIMATION LOOP
**************************************************/
var lastRender = Date.now();
var lastFpsCycle = Date.now();
function animate() {
	var delta = (Date.now() - lastRender)/1000;
	update(delta);
	lastRender = Date.now();
	draw();

	if(Date.now() - lastFpsCycle > 1000) {
		lastFpsCycle = Date.now();
		var fps = Math.round(1/delta);
		$("#fps").html("FPS: "+fps);
	}
	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update(dt) {
	if(localPlayer.isMoving()) {
		var pos = localPlayer.getPos();
		var absPos = localPlayer.getAbsPos();
		var bgPos = localPlayer.getBgPos();
		localPlayer.playerMove(dt);
		socket.emit("move player", {id: localPlayer.getID(), x: pos.x, y: pos.y, absX: absPos.absX, absY: absPos.absY, dir: localPlayer.getDir(), canvasX: bgPos.x, canvasY: bgPos.y});
	}
	if(localPlayer.isFighting()) {
		if(tellCounter == 0) {
			socket.emit("in fight", {id: localPlayer.getID(), enemyID: localPlayer.enemyID()});
			tellCounter++;
		}
	}
};


/**************************************************
** GAME DRAW
**************************************************/
var draw = function() {
	// Move Background if necessary4
	var bgPos = localPlayer.getBgPos();
	if(parseInt(document.getElementById("bgDiv").style.marginLeft) != bgPos.x) {
		document.getElementById("bgDiv").style.marginLeft = bgPos.x + "px";
	}
	if(parseInt(document.getElementById("bgDiv").style.marginTop) != bgPos.y) {
		document.getElementById("bgDiv").style.marginTop = bgPos.y + "px";
	}
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw World
	var worldRight = worldSize * tileSize;
	var worldBottom = worldSize * tileSize;

	// Draw enemies
	for (var i = 0; i < enemies.length; i++) {
		if(enemies[i].isAlive()) {
			enemies[i].draw(ctx, bgPos.x, bgPos.y);
		}
	}

	// Draw remote players
	for (var i = 0; i < remotePlayers.length; i++) {
		remotePlayers[i].draw(ctx, bgPos.x, bgPos.y);
	};

	// Draw local player
	localPlayer.draw(ctx, bgPos.x, bgPos.y);

	// Draw items
	for (var i = 0; i < items.length; i++) {
			ctx.drawImage(itemsprites, items[i][2]*44, 0, 44, 44, items[i][0]+bgPos.x, items[i][1]+bgPos.y, 32, 32);
	}

	// Draw npcs
	for (var i = 0; i < npcs.length; i++) {
			npcs[i].draw(ctx, bgPos.x, bgPos.y);
	}

	// If player is in fight, display stats of enemy
	if(localPlayer.isGoingToFight()) {
		var enemy = enemies[localPlayer.enemyID()];
		var value = localPlayer.isFighting();
		if(enemy.isAlive() && $("#enemyLevel").hasClass('hideClass')) {
			enemy.displayStats();
		}
	}
	else if(!$("#enemyLevel").hasClass('hideClass')) {
		$("#enemyLevel").addClass('hideClass');
		$("#enemyName").addClass('hideClass');
		$("#enemyHeart").addClass('hideClass');
		$("#enemyHealthBorder").addClass('hideClass');
		$("#enemyHealth").addClass('hideClass');
	}
};

/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	for (var i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].getID() == id) {
			return remotePlayers[i];
		}
	};
	
	return false;
};
