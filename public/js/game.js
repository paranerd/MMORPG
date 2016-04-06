// Game variables
var canvas,		// Canvas DOM element
	bgCanvas,	// Canvas for static background
	ctx,		// Canvas rendering context
	bgCtx,		// Canvas background rendering context
	mapCanvas,
	mapCtx,
	localPlayer,	// Local player
	remotePlayers,	// Remote players
	enemies = [],	// Contains the enemies
	items = [],
	npcs = [],
	playersprite,
	spritesheet,
	itemsprites,
	npcsprite,
	renderMap,		// Contains the map
	collisionWorld,	// Map containing NPCs and enemies, 0 = walkable, 1 = enemy, 2 = enemy, 3 = not walkable
	worldSize,
	tileSize,
	adjustedTileSize,
	lastClicked = {x: null, y: null},
	lastMapUpdate = Date.now(),
	socket,		// Socket connection
	chatTxtClr = "#c96",
	tellCounter = 0,
	lastRender = Date.now(),
	lastFpsCycle = Date.now(),
	questlist = [],
	bgPos = {x: 0, y: 0};

window.onload = function() {
	// Initialize socket connection
	socket = io.connect('http://localhost:8000');

	// Start listening for events
	setEventHandlers();
	
	// Fialize chatlog scrollbar
	simpleScroll.init("chatlog");
}

// GAME EVENT HANDLERS
var setEventHandlers = function() {
	// Window resize
	window.addEventListener("resize", onResize, false);

	// Socket connection successful
	socket.on("connect", onSocketConnected);

	socket.on("update player", updatePlayer);

	socket.on("remove player", onRemovePlayer);

	socket.on("new message", receiveMessage);
	
	socket.on("update enemy", updateEnemy);

	socket.on("update quest", updateQuest);

	socket.on("player hurt", onPlayerHurt);

	socket.on("update world", onUpdateWorld);

	socket.on("update item", updateItem);
	
	socket.on("get item", getItem);

	socket.on("new npc", onNewNpc);

	socket.on("create localplayer", onCreateLocalPlayer);

	socket.on("init map", onInitMap);

	socket.on("init collisionMap", onInitCollisionMap);

	socket.on("validated", startGame);

	socket.on("no player", playerNotFound);
};

function startGame() {
	playersprite = new Image();
	playersprite.src = 'sprites/player_complete.png';
	spritesheet = new Image();
	spritesheet.src = 'sprites/spritesheet.png';
	npcsprite = new Image();
	npcsprite.src = 'sprites/npc.png';

	itemsprites = new Image();
	itemsprites.src = 'sprites/itemsprites.png';

	// Background music
	//var bgMusic = new Audio("sounds/bgmusic.ogg");
	//bgMusic.play();

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
	canvas.width = 640;
	canvas.height = 640;
	bgCanvas.width = 1184;
	bgCanvas.height = 1184;

	// Initialise remote players array
	remotePlayers = [];
};

function playerNotFound() {
	window.location = "login.html";
};

function toggleMap() {
	if ($("#mapCanvas").hasClass("hidden")) {
		$("#mapCanvas").removeClass("hidden");
		drawMap();
	}
	else {
		$("#mapCanvas").addClass("hidden");
	}
};

function toggleQuests() {
	if($("#questMenu").hasClass("hidden")) {
		$("#questMenu").removeClass("hidden");
		quests.innerHTML = "";

		var playerquests = localPlayer.openQuests;
		if(playerquests.length == 0) {
			$("#quests").append("<p>No Quests available</p>");
			return;
		}

		for(var i = 0; i < playerquests.length; i++) {
			$("#quests").append("<p>" + playerquests[i].quest.desc + ": " + playerquests[i].amount + " / " + playerquests[i].quest.target + "</p>");
		}
	}
	else {
		$("#questMenu").addClass("hidden");
	}
};

function onInitCollisionMap(map) {
	collisionMap = map;
};

function onNewNpc(npc) {
	npcs.push(npc);
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
	for (var w = 0; w < worldSize; w++) {
		for (var h = 0; h < worldSize; h++) {
			spriteNum = renderMap[w][h];

			// Draw it
			mapCtx.drawImage(spritesheet, spriteNum * tileSize, 0, tileSize, tileSize, w * adjustedTileSize, h * adjustedTileSize, adjustedTileSize, adjustedTileSize);
		}
	}

	mapCtx.drawImage(playersprite, 0, 84, 42, 44, localPlayer.pos.x / 32 * adjustedTileSize, localPlayer.pos.y / 32 * adjustedTileSize, adjustedTileSize, adjustedTileSize);
	$("#mapCanvas").removeClass("hidden");
};

function updateItem(data) {
	var item = itemById(data.item.id);
	
	if(item) {
		if(data.remove) {
			items.splice(items.indexOf(data.item), 1);
		}
	}
	else if (!data.remove) {
		items.push(data.item);
	}
};

function getItem(data) {
	localPlayer.takeItem(data.item, data.quantity);
	updateInventory();
	displayStats();
}

function onUpdateWorld(data) {
	renderMap[data.x][data.y] = data.id;
};

function onPlayerHurt(data) {
	if(data.id == localPlayer.id) {
		localPlayer.getHurt(data.amount);
		displayStats();
	}
};

function updateQuest(data) {
	questlist.push(data);
}

function updateEnemy(data) {
	var enemy = getEnemyById(data.enemy.id);
	
	if(enemy) {
		enemies[data.enemy.id] = data.enemy;

		if (data.amount) {
			if (data.enemy.id == localPlayer.fighting) {
				localPlayer.playSwordSound();
				displayEnemyStats(data.enemy.id);
			}
		}
		
		if(data.enemy.currhp <= 0) {
			tellCounter = 0;
			renderMap[data.enemy.x / 32][data.enemy.y / 32] = 0;
			
			if (data.enemy.id == localPlayer.fighting) {
				lastClicked = {x: null, y: null};
				localPlayer.setGoFight(null);
				localPlayer.addXP(data.xp);
				displayStats();
				localPlayer.updateQuest(data.enemy.type, 1);
			}
		}
		else {
			renderMap[data.enemy.x / 32][data.enemy.y / 32] = 1;
		}
	}
	else {
		enemies.push(data.enemy);
		renderMap[data.enemy.x / 32][data.enemy.y / 32] = 1;
	}
}

function updatePlayer(data) {
	var player = playerById(data.id);
	
	if(player) {
		// Update player position
		player.pos.x = data.pos.x;
		player.pos.y = data.pos.y;
		player.dir = data.dir;
	}
	else {
		if(localPlayer && data.id == localPlayer.id) {
			// Something
		}
		else {
			// Initialise new remote player
			var newPlayer = new Player(data.pos.x, data.pos.y, data.name, data.currhp, data.id, data.dir);
			newPlayer.tileSize = tileSize;

			// Add new player to the remote players array
			remotePlayers.push(newPlayer);
		}
	}
}

function onCreateLocalPlayer(data) {
	localPlayer = new Player(data.pos.x, data.pos.y, data.name, data.currhp, data.id, data.dir);
	localPlayer.tileSize = tileSize;
	displayStats();
	initInventory();
	initMap();
	playerName.innerHTML = data.name;
	animate();
};

function initInventory() {
	for(var i = 0; i < localPlayer.inventoryMax; i++) {
		$("#inventoryContainer").append('<div id="box'+i+'" class="invBox" value="'+i+'"></div>');
		$('#box'+i).append('<div id="box'+i+'index" class="invBoxIndex"></div>');
		$('#box'+i).click(function() {
			localPlayer.useItem(this);
			updateInventory();
			displayStats();
		});
		$('#box'+i).hover(function() {
			showItemDetails($(this).attr('value'), $(this).offset().left, $(this).offset().top);
		}, function() {
			$("#details").addClass("hidden");
		});
	}
}

function showItemDetails(index, x, y) {
	var inventory = localPlayer.inventory;
	
	if(!inventory[index]) {
		return;
	}
	
	$("#details").removeClass("hidden");
	
	$("#details").css({
		left: x + 50,
		top: y + 50
	});

	details.innerHTML = inventory[index].item.desc;
}

function initMap() {
	// Draw World
	var spriteNum = 0;
	for (var w = 0; w < worldSize; w++) {
		for (var h = 0; h < worldSize; h++) {
			// Don't draw enemies
			if(renderMap[w][h] == 1) {
				spriteNum = 0;
			}
			else {
				spriteNum = renderMap[w][h];
			}
			bgCtx.drawImage(spritesheet, spriteNum * tileSize, 0, tileSize, tileSize, w * tileSize, h * tileSize, tileSize, tileSize);
		}
	}
};

function sendMessage() {
	var text = chatInput.value;
	var sayMode;
	var chatTo = null;

	if(text) {
		if(text.charAt(0) == "#") {
			if(text.charAt(1) == "s") {
				sayMode = "s";
				text = text.substring(3);
			}
			else if(text.charAt(1) == "w") {
				sayMode = "w";
				chatTo = text.substring(3, text.indexOf(' ', 3));
				text = text.substring(text.indexOf(' ', 3));
			}
			else if(text.charAt(1) == "n") {
				sayMode = "n";
				text = text.substring(3);
			}
		}
		socket.emit("new message", {mode: sayMode, text: text, chatTo: chatTo});
	}
	chatInput.value = "";
}

function receiveMessage(data) {
	var pColor = (data.player == localPlayer.name) ? "#CD96CD" : "#96CDCD";

	switch(data.mode) {
		case "s":
			chatTxtClr = "yellow";
			break;
		case "w":
			chatTxtClr = "red";
			break;
		default:
			chatTxtClr = "white";
	}

	simpleScroll.append("<span style='color: "+pColor+";'>"+data.player+": </span>"+"<span style='color: "+chatTxtClr+";'>"+data.text+"</span></br>");
}

function logout() {
	socket.emit("logout");
	window.location = "login.html";
}

document.onkeyup = function(e) {
	if(e.target.id != "chatInput") {
		// M for map
		if(e.keyCode == 77) { // M
			toggleMap();
		}
		else if(e.keyCode == 81) { // Q
			toggleQuests();
		}
		// Quick access to the inventory, numbers 1 - 9
		else if(e.keyCode > 48 && e.keyCode < 58) {
			localPlayer.useItem($("#box"+(e.keyCode-48-1)));
			updateInventory();
		}
		// Show chat-input-prompt on "Return"
		else if(e.keyCode == 13) {
			$("#chatInput").focus();
		}
	}
}

function getClickedTile(e) {
	var x = e.pageX - $("#gameArea").position().left - canvas.offsetLeft;
	var y = e.pageY - $("#gameArea").position().top - canvas.offsetTop;
	x = Math.floor((x - bgPos.x) / tileSize);
	y = Math.floor((y - bgPos.y) / tileSize);
	return {x: x, y: y};
}

gameArea.onclick = function(e) {
	var tile = getClickedTile(e);

	// To avoid a bug, where player wouldn't walk anymore, when clicked twice on the same tile
	if (!(tile.x == lastClicked.x && tile.y == lastClicked.y) &&
		!(tile.x * 32 == localPlayer.pos.x && tile.y * 32 == localPlayer.pos.y))
	{
		$("#conversation, #confirmation").addClass("hidden");
		lastClicked = tile;
		// Going to talk to NPC
		if(collisionMap[tile.x][tile.y] == 2) {
			lastClicked = {x: null, y: null};
			var npc = getNpcAt(tile.x * 32, tile.y * 32);

			if(npc.questID != null) {
				var quest = questlist[npc.questID];
				localPlayer.addQuest(quest);
			}
			
			localPlayer.setGoToNpc(npc);
		}
		// Going to attack enemy
		else if(collisionMap[tile.x][tile.y] == 1) {
			for(var i = 0; i < enemies.length; i++) {
				if(enemies[i].alive && tile.x * 32 == enemies[i].x && tile.y * 32 == enemies[i].y) {
					localPlayer.setGoFight(i);
					break;
				}
			}
		}
		else {
			if(localPlayer.fighting != null) {
				tellCounter = 0;
				socket.emit("abort fight", {id: localPlayer.id});
			}
			localPlayer.justWalk();
		}
		localPlayer.stop = true;

		// Wait for the player to stop at next tile
		var timer = setInterval(function() {
			if(!localPlayer.moving) {
				clearTimeout(timer);
				localPlayer.stop = false;
				var pathStart = [localPlayer.pos.x / tileSize, localPlayer.pos.y / tileSize];

				// Calculate path
				var path = Pathfinder(collisionMap, pathStart, tile);
				if(path.length > 0) {
					localPlayer.setPath(path);
				}
			}
		}, 1);
	}
};

// Browser window resize
function onResize(e) {
	$('#gameArea').css({
		left: ($(window).width() - $('#gameArea').width())/2,
		top: ($(window).height() - $('#gameArea').height())/2
	});
	$('#questMenu').css({
		left: ($(window).width() - $('#questMenu').width())/2,
		top: ($(window).height() - $('#questMenu').height())/2
	});
	
	adjustedTileSize = Math.floor(window.innerHeight / worldSize);
	$('#mapCanvas').css({
		left: ($(window).width() - adjustedTileSize * worldSize)/2,
		top: ($(window).height() - adjustedTileSize * worldSize)/2,
		width: adjustedTileSize * worldSize,
		height: adjustedTileSize * worldSize
	});

	$('#conversation, #confirmation').css({
		top: $("#gameArea").offset().top + $("#gameArea").height() - $("#confirmation").height() - 50,
		left: ($("#gameArea").width() - $('#conversation').width()) / 2 + ($(window).width() - $("#gameArea").width()) / 2,
	});

	mapCanvas.width = adjustedTileSize * worldSize;	
	mapCanvas.height = adjustedTileSize * worldSize;
};

// Socket connected
function onSocketConnected() {
	// Tell game server client connected
	socket.emit("player connected", {name: sessionStorage.playerName});
};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Player not found
	if (!removePlayer) {
		return;
	};

	// Remove player from array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

// GAME ANIMATION LOOP
function animate() {
	var delta = (Date.now() - lastRender) / 1000;
	update(delta);
	lastRender = Date.now();
	draw();

	if(Date.now() - lastFpsCycle > 1000) {
		lastFpsCycle = Date.now();
		var fps = Math.round(1 / delta);
		$("#fps").html("FPS: "+fps);
	}
	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};

// GAME UPDATE
function update(dt) {
	if (localPlayer.moving || (localPlayer.fighting != null && tellCounter == 0)) {
		localPlayer.playerMove(dt);
		socket.emit("update player", {id: localPlayer.id, x: localPlayer.pos.x, y: localPlayer.pos.y, dir: localPlayer.dir, enemyID: localPlayer.fighting});
		tellCounter++;
	}
	else if (localPlayer.talkingTo != null && $("#conversation").hasClass("hidden")) {
		showConversation();
	}
};

// GAME DRAW
var draw = function() {
	// Move Background if necessary
	bgPos.x = (localPlayer.pos.x >= 320 && localPlayer.pos.x < worldSize * tileSize - 320) ? -1 * (localPlayer.pos.x - 320) : bgPos.x;
	bgPos.x = (bgPos.x > 0) ? 0 : bgPos.x;
	bgPos.y = (localPlayer.pos.y >= 320 && localPlayer.pos.y < worldSize * tileSize - 320) ? -1 * (localPlayer.pos.y - 320) : bgPos.y;
	bgPos.y = (bgPos.y > 0) ? 0 : bgPos.y;

	bgDiv.style.marginLeft = bgPos.x + "px";
	bgDiv.style.marginTop = bgPos.y + "px";

	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw enemies
	for (var i = 0; i < enemies.length; i++) {
		if(enemies[i].alive) {
			drawEnemy(i);
		}
	}

	// Draw remote players
	for (var i = 0; i < remotePlayers.length; i++) {
		drawPlayer(remotePlayers[i]);
	};

	// Draw local player
	drawPlayer(localPlayer);

	// Draw items
	for (var i = 0; i < items.length; i++) {
		ctx.drawImage(itemsprites, (items[i].type - 10) * 44, 0, 44, 44, items[i].x + bgPos.x, items[i].y + bgPos.y, 32, 32);
	}

	// Draw npcs
	for (var i = 0; i < npcs.length; i++) {
		ctx.drawImage(npcsprite, 44, 0, 44, 44, npcs[i].x + bgPos.x, npcs[i].y + bgPos.y, 32, 32);
	}

	// If player is in fight, display stats of enemy
	if(localPlayer.isGoingToFight()) {
		var enemy = enemies[localPlayer.isGoingToFight()];
		var value = localPlayer.fighting;
		if(enemy.alive && $("#enemyLevel").hasClass('hidden')) {
			displayEnemyStats(localPlayer.isGoingToFight());
		}
	}
	else if(!$("#enemyLevel").hasClass('hidden')) {
		$("#enemyLevel, #enemyName, #enemyHeart, #enemyHealthBox, #enemyHealth").addClass('hidden');
	}
};

// Helper
function playerById(id) {
	for (var i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id) {
			return remotePlayers[i];
		}
	};
	
	return false;
};

function npcById(id) {
	for (var i = 0; i < npcs.length; i++) {
		if (npcs[i].id == id) {
			return npcs[i];
		}
	};
}

function itemById(id) {
	for (var i = 0; i < items.length; i++) {
		if (items[i].id == id) {
			return items[i];
		}
	};
	
	return false;
};

function getNpcAt(x, y) {
	for(var i = 0; i < npcs.length; i += 1) {
		if(x == npcs[i].x && y == npcs[i].y) {
			return npcs[i];
		}
	}
}

function getEnemyById(id) {
	for(var i = 0; i < enemies.length; i++) {
		if(id == enemies[i].id) {
			return enemies[i];
		}
	}
}

function updateInventory() {
	for(var i = 0; i < localPlayer.inventoryMax; i++) {
		$("#box"+i).css('background', '');
		$('#box'+i+'index').html('');
	}
	
	for(var i = 0; i < localPlayer.inventory.length; i++) {
		var type = localPlayer.inventory[i].item.type;
		
		var itemPath = "healthPotion.png";
		$('#box'+i).css({backgroundImage: 'url(sprites/' + itemPath + ')'});
		$('#box'+i+'index').html(localPlayer.inventory[i].quantity);
	}
}

function displayStats() {
	// Health
	$("#health").width(((localPlayer.currhp / localPlayer.maxhp) * 100) + "%");
	$("#coins").html(localPlayer.money);
	$("#playerLevel").html(localPlayer.level);

	// Experience
	var expWidth = 100; // 150 * ((localPlayer.xp - stats.xpForLevel(localPlayer.level - 1)) / (stats.xpForLevel(stats.level) - stats.xpForLevel(stats.level - 1))) + "px";
	$("#playerXP").width(expWidth);
}

function displayEnemyStats(id) {
	var enemy = enemies[id];
	// Level
	$("#enemyLevel").removeClass('hidden');
	$("#enemyLevel").html(enemy.level);

	// Health
	var width = 146 * (enemy.currhp / enemy.maxhp) + "px";
	$("#enemyHeart, #enemyName, #enemyHealthBox").removeClass('hidden');
	$("#enemyHealth").removeClass('hidden').width(width);
}

function drawEnemy(id) {
	var enemy = enemies[id];
	ctx.fillStyle = "#00F";
	ctx.strokeStyle = "#F00";
	ctx.font = "10pt Arial";
	var sprite = new Image();
	sprite.src = 'sprites/spritesheet.png';
	ctx.drawImage(sprite, 32, 0, 32, 32, enemy.x + bgPos.x, enemy.y + bgPos.y, 32, 32);

	var hitDelta = Date.now() - enemy.lastHitPointUpdate;

	if (enemy.hitArray.length > 0 && hitDelta > 50) {
		for(var i = 0, j = enemy.hitArray.length; i < j; i+=1) {
			if(enemy.hitArray[i] != null) {
				enemy.lastHitPointUpdate = Date.now();
				enemy.hitArray[i][1] = Math.round((enemy.hitArray[i][1]-0.1)*10)/10;
	
				if(enemy.hitArray[i][1] <= 0) {
					//gotHit = false;
					enemy.hitArray.splice(i,1);
				}
			}
		}
	}
	else if (enemy.hitArray.length == 0) {
		enemy.gotHit = false;
	}

	if(enemy.hitArray.length > 0) {
		for(var i = 0, j = enemy.hitArray.length; i < j; i+=1) {
			ctx.fillStyle = 'rgba(0,255,0,'+enemy.hitArray[i][1]+')';//"#F00";
			ctx.strokeStyle = "#F00";
			ctx.font = "14pt Minecraftia";
			ctx.fillText(enemy.hitArray[i][0], enemy.x + bgPos.x + 12, enemy.y + bgPos.y - 20);
		}
	}
}

function drawPlayer(player) {
	if(player.moving && (Date.now() - player.lastFrameUpdate > 150)) {
		player.lastFrameUpdate = Date.now();
		player.frame = (this.frame < 3) ? player.frame + 1 : 0;
	}
	else if(!player.moving) {
		player.frame = 0;
	}

	ctx.fillStyle = "#000";
	ctx.font = "0.75rem aaargh bold";
	ctx.fillText(player.name, player.pos.x + bgPos.x, player.pos.y + bgPos.y - 10);
	ctx.drawImage(playersprite, player.frame * 42, player.dir * 43, 42, 43, player.pos.x + bgPos.x, player.pos.y + bgPos.y, 32, 32);

	var hitDelta = Date.now() - player.lastHitPointUpdate;
	
	if(player.hitArray.length > 0 && hitDelta > 50) {
		for(var i = 0; i < player.hitArray.length; i++) {
			if(player.hitArray[i] != null) {
				player.lastHitPointUpdate = Date.now();
				player.hitArray[i][1] = Math.round((player.hitArray[i][1] - 0.1) * 10) / 10;
		
				if(player.hitArray[i][1] <= 0) {
					player.hitArray.splice(i,1);
				}
			}
		}
	}
	else if(player.hitArray.length == 0) {
		player.gotHit = false;
	}

	if(player.hitArray.length > 0) {
		for(var i = 0; i < player.hitArray.length; i++) {
			ctx.fillStyle = 'rgba(255,0,0,' + player.hitArray[i][1] + ')';
			ctx.font = "14pt Minecraftia";
			ctx.fillText(player.hitArray[i][0], player.pos.x + 12, player.pos.y - 20);
		}
	}
}

function showConversation() {
	$("#conversation").removeClass("hidden");
	var npc = npcById(localPlayer.talkingTo);
	var convData = localPlayer.getConversation(npc);

	if (!convData.text) {
		if(localPlayer.pendingQuest) {
			$("#confirmation").removeClass("hidden");
		}
		else {
			localPlayer.talkingTo = null;
			$("#conversation").addClass("hidden");
		}
	}

	else {
		if(convData.sec == 2) {
			var quest = questlist[npc.questID];
			localPlayer.takeItem({type: quest.itemReward, desc: "Description"}, 1);
			localPlayer.takeItem({type: 11}, quest.coinReward);
			updateInventory();
			displayStats();
		}
	
		convText.innerHTML = convData.text;
	}
}

convButton1.onclick = function() {
	showConversation();
}

yes.onclick = function() {
	localPlayer.confirmQuest();
	$("#confirmation").addClass("hidden");
	$("#conversation").addClass("hidden");
}

no.onclick = function() {
	localPlayer.declineQuest();
	$("#confirmation").addClass("hidden");
	$("#conversation").addClass("hidden");
}