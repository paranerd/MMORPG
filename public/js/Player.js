var Player = Class.extend({
	// Constructor
	init: function(x, y, pName, hp, id, remocal) {
		console.log("Player constructor: id="+id+", x="+x+", y="+y+", remote/local: "+remocal);
		this.pos = {x: x, y: y};
		this.absPos = {absX: x, absY: y};
		this.playerName = pName;
		this.currhp = hp;

		this.sound = new SoundManager();
		this.id = id;
		this.playerLevel = 1;
		this.levelBorders = [0, 5, 15, 30, 50];
		this.dir = 2;
		this.frame = 0;
		this.alive = true;
		this.maxhp = 100;
		this.xp = 0;
		this.finalDir;
		this.fightFrame = 0;
		this.money = 0;
		this.convPos = 0;
		this.moving = false;
		this.movingDir;
		this.path = [[]];
		this.speed = 200;
		this.mode = 0, // 0 = normal, 1 = fighting;
		this.hitSpeed = 500;
		this.lastStrike = 0;
		this.moveInterrupt = false;
		this.stepCount = 0;
		this.goAttack = false;
		this.goToNpc = false;
		this.fighting = false;
		this.playerAttacksEnemyID = null;
		this.bgPos = {x: 0, y: 0};
		this.moveAmount = 2;
		this.strength = 50;
		this.gotHit = false;
		this.hitArray = [];
		this.inventory = [];
		this.inventoryMax = 18;
		this.inventoryCol = 0;
		this.inventoryRow = 0;
		this.inventoryBox = 0;
		this.itemSlotsTaken = 0;
		this.tileSize;
		this.worldSize;
		this.worldRight;
		this.worldBottom;
		this.conversation = [];
		this.lastHitPointUpdate = Date.now();
		this.lastHitUpdate = Date.now();
		this.lastFrameUpdate = Date.now();
		this.conversation = [];
		this.openQuests = [];
		this.closedQuests = [];
		this.pendingQuest = [];
		this.rewardCompleted;
		this.waitForQuestConfirmation = false;

		// Sprites
		this.playersprite = new Image();
		//this.playersprite.src = 'sprites/playersprite_fight.png';
		this.playersprite.src = 'sprites/player_complete.png';
		this.spritesheet = new Image();
		this.spritesheet.src = 'sprites/spritesheet.png';

		// Sounds
		this.stepSnd = new Audio("sounds/walk.ogg");
	},

	xpForLevel: function(level) {
		return level*level*level;
	},

	getPos: function() {
		return this.pos;
	},

	getAbsPos: function() {
		return this.absPos;
	},

	playerQuests: function() {
		return this.openQuests;
	},

	pName: function() {
		return this.playerName;
	},

	getDir: function() {
		return this.dir;
	},

	getBgPos: function() {
		return this.bgPos;
	},

	getID: function() {
		return this.id;
	},

	enemyID: function() {
		return this.playerAttacksEnemyID;
	},

	strength: function() {
		return this.strength;
	},

	lastStrike: function() {
		return this.lastStrike;
	},

	currhp: function() {
		return this.currhp;
	},

	getHurt: function(amount) {
		this.currhp -= amount;
		this.sound.playSound("hurt");

		if(this.currhp <= 0) {
			this.currhp = 0;
			this.alive = false;
		}
		this.gotHit = true;
		this.hitArray.push([amount, 1.0]);
	},

	itemSlotsTaken: function() {
		return this.itemSlotsTaken;
	},

	level: function() {
		return this.playerLevel;
	},

	getInventoryMax: function() {
		return this.inventoryMax;
	},

	questConfirmationPending: function(questID, status, type, id, target, amount, itemReward, coinReward, shortDesc) {
		console.log("questConfirmationPending");
		this.pendingQuest = [questID, status, type, id, target, amount, itemReward, coinReward, false, shortDesc];
		this.waitForQuestConfirmation = true;
	},

	updateQuest: function(id, amount) {
		this.openQuests[id][5] += amount;
		console.log("Quest updated, amount: "+this.openQuests[id][5]+", target: "+this.openQuests[id][4]);
	},

	questCompleted: function(id) {
		console.log("Quest completed")
		this.openQuests[id][1] = 2;
	},

	rewardQuest: function(id) {
		this.rewardCompleted = id;
	},

	addXP: function(amount) {
		this.xp += amount;
		if(this.xp >= this.xpForLevel(this.playerLevel)) {
			this.playerLevel += 1;
		}
		this.displayStats();
	},

	xp: function() {
		return this.xp;
	},

	setWorldData: function(tileSize, worldSize) {
		this.tileSize = tileSize;
		this.worldSize = worldSize;
		this.worldBottom = this.worldRight = worldSize * tileSize;
	},

	setLastStrike: function(time) {
		this.lastStrike = time;
	},

	isGoingToFight: function() {
		return (this.goAttack || this.fighting);
	},

	isFighting: function() {
		return this.fighting;
	},

	isMoving: function() {
		return this.moving;
	},

	initInventory: function() {
		for(var i = 0; i < this.inventoryMax; i += 1) {
			this.inventory[i] = null;
		}
	},

	setPos: function(x, y) {
		this.pos.x = x;
		this.pos.y = y;
	},

	setAbsPos: function(absX, absY) {
		this.absPos.absX = absX;
		this.absPos.absY = absY;
	},

	setGoToNpc: function(value) {
		this.goToNpc = value;
		this.stopTalking();
	},

	setGoAttack: function(value) {
		this.goAttack = value;
		if(value == false) {
			this.fighting = false;
			this.mode = 0;
		}
	},

	setDir: function(dir) {
		this.dir = dir;
	},

	setMoveInterrupt: function(value) {
		this.moveInterrupt = value;
	},

	setEnemyID: function(id) {
		this.playerAttacksEnemyID = id;
	},

	setPath: function(path) {
		this.path = path;
		this.moving = true;
	},

	setBgPos: function(x, y) {
		this.bgPos.x = x;
		this.bgPos.y = y;
	
	},

	setCurrHP: function(value) {
		this.currhp = value;
	},

	talkToNPC: function(conv) {
		this.conversation = conv;
	},

	playSwordSound: function() {
		this.sound.playSound("sword");

		this.fightFrame = 0;
		var hit = setInterval(function() {
			var strikeDelta = Date.now() - this.lastHitUpdate;
			if(strikeDelta > 100 && this.fightFrame < 2) {
				this.lastUpdateTime = Date.now();
				this.nextFrame();
			}
			else if(strikeDelta > 500 && this.fightFrame == 2) {
				clearTimeout(hit);
			}
		}, 50);
	},

	nextFrame: function() {
		if(this.fightFrame == 2) {
			this.fightFrame = 2;
		}
		else {
			this.fightFrame++;
		}
	},

	displayStats: function() {
		var money = this.money,
			healthWidth = this.healthWidth,
			playerLevel = this.playerLevel;
		// Health
		var healthWidth = 146*(this.currhp/this.maxhp) + "px";
		$("#health").width(healthWidth);
		$("#coins").html(money);
		$("#playerLevel").html(playerLevel);

		// Experience
		var expWidth = 150*((this.xp-this.xpForLevel(this.playerLevel-1))/(this.xpForLevel(this.playerLevel)-this.xpForLevel(this.playerLevel-1))) + "px";
		$("#playerExperience").width(expWidth);
	},

	useItem: function(box) {
		var inventory = this.inventory;
		var boxID = ($(box).attr("id").substring(3));
			if(this.inventory[boxID] != null) {
			if(this.inventory[boxID][0] == 0 && this.currhp < this.maxhp) {
				this.sound.playSound("potion");
				this.currhp+=20;
				if(this.currhp > this.maxhp) {
					this.currhp = this.maxhp;
				}
			}

			// Decrease amount of that item
			this.inventory[boxID][1]--;

			// More than 2 of that items left, decrease index
			if(this.inventory[boxID][1] > 1) {
				$('#box'+boxID+'index').html(inventory[boxID][1]);
			}
			// Exactly 2 of that item left, remove index
			else if(this.inventory[boxID][1] == 1) {
				$('#box'+boxID+'index').html("");
			}
			// Just one left, remove item from inventory
			else {
				this.inventory[boxID] = null;
				$(box).css({
					backgroundImage: ''
				});
				$(box).off('mouseenter mouseleave');
				$("#details").addClass("hideClass");
			}
		}
		this.displayStats();
	},


	takeItem: function(type, change) {
		var itemPath;
		var foundItem = false;
		var self = this;

		if(type == 0) {
			itemPath = "healthPotion.png";
		}
		else if(type == 1) {
			this.money += change;
			this.sound.playSound("coins");
			this.displayStats();
			return;
		}

		// Search inventory for that item
		for(var i = 0, max = this.inventory.length; i < max; i += 1) {
			if(this.inventory[i] != null && this.inventory[i][0] == type) {
				this.inventory[i][1]++;
				$('#box'+i+'index').html(self.inventory[i][1]);
				foundItem = true;
				break;
			}
		}

		// Add new item to inventory
		if(!foundItem) {
			var self = this;
			for(var i = 0, max = this.inventory.length; i < max; i += 1) {
				if(this.inventory[i] == null) {
					$('#box'+i).css({
						backgroundImage: 'url(sprites/'+itemPath+')'
					});
					$('#box'+i).hover(function() {self.showItemDetails(type, $(this).offset().left, $(this).offset().top);}, function() {self.hideItemDetails();});
					this.inventoryBox++;
					var newItem = [type, 1];
					this.inventory[i] = newItem;
					break;
				}
			}
		}
		// Play loot.ogg
		this.sound.playSound("loot");
	},

	showItemDetails: function(type, left, top) {
		$("#details").removeClass("hideClass");
		$("#details").css({
			left: left+50,
			top: top+50
		});
		console.log("Show details, type: "+type+", left: "+left+", top: "+top);
		switch(type) {
			case 0:
			$("#details").html("Potion</br>Regenerates 20 HP");
		}
	},

	hideItemDetails: function() {
		$("#details").addClass("hideClass");
	},

	playerMove: function (dt) {
		if(this.stepSnd.paused) {
			this.stepSnd.currentTime = 0;
			this.stepSnd.play();
		}
		var pathValue;
		// Check if on the way to attack
		if((this.goAttack || this.goToNpc) && this.stepCount==0) {
			// Face player towards enemy
			if(this.path[this.path.length-1][0] > this.path[this.path.length-2][0]) {
				this.finalDir=1;
			}
			else if(this.path[this.path.length-1][0] < this.path[this.path.length-2][0]) {
				this.finalDir=3;
			}
			else if(this.path[this.path.length-1][1] > this.path[this.path.length-2][1]) {
				this.finalDir=2;
			}
			else if(this.path[this.path.length-1][1] < this.path[this.path.length-2][1]) {
				this.finalDir=0;
			}

			// Remove last path element so player doesn't step on enemy
			this.path.pop();
		}

		// Path length is 1 i.e. when clicked on player position
		if(this.path.length>=1) {

			// Moving left
			if(this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"] < this.pos["x"]) {
				this.dir = 3;
				if(this.pos["x"] > 320 || this.bgPos["x"] == 0) {
					this.pos["x"] -= Math.round(this.speed * dt);
					var test = this.worldRight + this.bgPos["x"];
					if(this.pos["x"] < 320 && this.bgPos["x"] < 0) {
						var diff = 320 - this.pos["x"];
						this.pos["x"] = 320;
						this.bgPos["x"] += diff;
					}
				}
				else {
					this.bgPos["x"] += Math.round(this.speed*dt);
				}
				this.absPos["absX"] -= Math.round(this.speed*dt);
				if(this.pos["x"] < this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"]) {
					var diff = this.pos["x"] - (this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"]);
					pathValue = this.path[this.stepCount][0]*tileSize + this.bgPos["x"];
					if(this.pos["x"] < 320 || (this.worldRight + this.bgPos["x"] == 640)) {
						this.pos["x"] = this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"];
					}
					else {
						if(this.pos["x"] > 320 && this.bgPos["x"] < 0) {
							this.pos["x"] = 320;
						}
						this.bgPos["x"]+=diff;
					}
					this.absPos["absX"] -= diff;
				}
			}
		
			// Moving right
			else if(this.path[this.stepCount][0] * this.tileSize+this.bgPos["x"] > this.pos["x"]) {
				this.dir = 1;
				if(this.pos["x"] < 320 || (this.worldRight + this.bgPos["x"] == 640)) {
					this.pos["x"] += Math.round(this.speed * dt);
					if(this.pos["x"] > 320 && (this.worldRight + this.bgPos["x"]) > 640) {
						var diff = this.pos["x"] - 320;
						this.pos["x"] = 320;
						this.bgPos["x"] -= diff;
					}
				}
				else {
					this.bgPos["x"] -= Math.round(this.speed * dt);
				}
				this.absPos["absX"] += Math.round(this.speed * dt);
				
				if(this.pos["x"] > this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"]) {
					var diff = this.pos["x"] - (this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"]);
					pathValue = this.path[this.stepCount][0] * tileSize + this.bgPos["x"];
					if(this.pos["x"] < 320 || (this.worldRight + this.bgPos["x"] == 640)) {
						this.pos["x"] = this.path[this.stepCount][0] * this.tileSize + this.bgPos["x"];
					}
					else {
						if(this.pos["x"] > 320 && (this.worldRight + this.bgPos["x"]) > 640) {
							this.pos["x"] = 320;
						}
						this.bgPos["x"]+=diff;
					}
					this.absPos["absX"] -= diff;
				}
			}
			// Moving up
			else if(this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"] < this.pos["y"]) {
				this.dir = 0;
				if(this.pos["y"] > 320 || this.bgPos["y"] == 0) {
					this.pos["y"] -= Math.round(this.speed * dt);
					if(this.pos["y"] < 320 && this.bgPos["y"] < 0) {
						var diff = 320 - this.pos["y"];
						this.pos["y"] = 320;
						this.bgPos["y"] += diff;
					}
				}
				else {
					this.bgPos["y"] += Math.round(this.speed*dt);
				}
				this.absPos["absY"] -= Math.round(this.speed * dt);
				if(this.pos["y"] < this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"]) {
					var diff = this.pos["y"] - (this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"]);
					pathValue = this.path[this.stepCount][1]*tileSize+this.bgPos["y"];
					if(this.pos["y"] < 320 || (this.worldBottom + this.bgPos["y"] == 640)) {
						this.pos["y"] = this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"];
					}
					else {
						if(this.pos["y"] > 320 && this.bgPos["y"] < 0) {
							this.pos["y"] = 320;
						}
						this.bgPos["y"]+=diff;
					}
					this.absPos["absY"] -= diff;
				}
			}
			// Moving down
			else if(this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"] > this.pos["y"]) {
				this.dir = 2;
				// Is player near upper or bottom edge?
				if(this.pos["y"] < 320 || (this.worldBottom + this.bgPos["y"] == 640)) {
					this.pos["y"] += Math.round(this.speed * dt);
					if(this.pos["y"] > 320 && (this.worldBottom + this.bgPos["y"]) > 640) {
						var diff = this.pos["y"] - 320;
						this.pos["y"] = 320;
						this.bgPos["y"] -= diff;
					}
				}
				else {
					this.bgPos["y"] -= Math.round(this.speed * dt);
				}
				this.absPos["absY"] += Math.round(this.speed * dt);
				if(this.pos["y"] > this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"]) {
					var diff = this.pos["y"] - (this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"]);
					pathValue = this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"];
					if(this.pos["y"] < 320 || (this.worldBottom + this.bgPos["y"] == 640)) {
						this.pos["y"] = this.path[this.stepCount][1] * this.tileSize + this.bgPos["y"];
					}
					else {
						if(this.pos["y"] > 320 && (this.worldBottom + this.bgPos["y"]) > 640) {
							this.pos["y"] = 320;
						}
						this.bgPos["y"]+=diff;
					}
					this.absPos["absY"] -= diff;
				}
			}
			else {
				// Next tile-step
				if(this.stepCount < this.path.length-1 && !this.moveInterrupt) {
					this.stepCount++;
				}
				// End of path
				else {
					if(this.goAttack) {
						this.goAttack = false;
						this.fighting = true;
						this.mode = 1;
						this.dir = this.finalDir;
					}
					else if(this.goToNpc) {
						this.goToNpc = false;
						$("#conversation").removeClass("hideClass");
						console.log("Unhide conversation");
						this.convPos = 0;
						this.talk();
						this.dir = this.finalDir;
					}
					this.moving = false;
					this.stepSnd.pause();
					this.stepCount=0;
				}
			}
		}
		
		$("#kontrolle").html("x: "+this.pos["x"]+"</br>y: "+this.pos["y"]+"</br>absX: "+this.absPos["absX"]+"</br>absY: "+this.absPos["absY"]+"</br>cXnull: "+this.bgPos["x"]+"</br>cYnull: "+this.bgPos["y"]+"</br>path: "+pathValue);
	},

	talk: function() {
		var self = this;
		$("#convText").html(this.conversation[this.convPos]);
		if(this.rewardCompleted != null) {
			if(this.openQuests[this.rewardCompleted][6] != null) {
				this.takeItem(0, null);
			}
			if(this.openQuests[this.rewardCompleted][7] != null) {
				this.takeItem(1, 500);
			}
			this.openQuests[this.rewardCompleted][8] = true;
			this.rewardCompleted = null;
		}
		if(this.convPos < this.conversation.length - 1) {
			$("#convButton1").html("Next");
			this.convPos++;
			$("#convButton1").unbind('click');
			var talk = this.talk();
			$("#convButton1").click(function (){talk;});
		}
		else {
			this.convPos = 0;
			$("#convButton1").html("Good Bye!");
			$("#convButton1").unbind('click');
			$("#convButton1").click(function (){$("#conversation").addClass("hideClass"); if(self.waitForQuestConfirmation) {self.showQuestConfDialog();}});
		}
	},

	showQuestConfDialog: function() {
		var self = this;
		//$("#questConfirmation").removeClass("hideClass");
		console.log("showQuestConfDialog");
		$("#confirmation").removeClass("hideClass");
		$("#yes").click(function() {self.confirmQuest(); $("#confirmation").addClass("hideClass");});
		$("#no").click(function() {self.declineQuest(); $("#confirmation").addClass("hideClass");});
	},

	confirmQuest: function() {
		this.openQuests.push(this.pendingQuest);
		console.log("Player got a new Quest with id"+this.pendingQuest[0]+", openQuests.length: "+this.openQuests.length);
		this.pendingQuest = [];
		this.waitForQuestConfirmation = false;
		$("#yesButton").unbind('click');
		$("#noButton").unbind('click');
	},

	declineQuest: function() {
		this.pendingQuest = [];
		this.waitForQuestConfirmation = false;
	},

	stopTalking: function() {
		this.convPos = 0;
		$("#conversation").addClass("hideClass");
		console.log("Hide conversation");
	},

	nextFrame: function() {
		if(this.frame < 3) {
			this.frame++;
		}
		else {
			this.frame = 0;
		}
	},

	// Draw
	draw: function(ctx, cXnull, cYnull) {
		if(this.moving && (Date.now() - this.lastFrameUpdate > 150)) {
			this.lastFrameUpdate = Date.now();
			this.nextFrame();
		}
		else if(!this.moving) {
			this.frame = 0;
		}
		//console.log("Draw player");
		ctx.fillStyle = "#FFF";
		ctx.font = "9pt Minecraftia";
		ctx.fillText(this.playerName, this.absPos["absX"] + cXnull, this.absPos["absY"] + cYnull-10);
		/*if(this.mode == 0) {
			ctx.drawImage(this.playersprite, this.dir*44, this.mode, 44, 44, this.absPos["absX"] + cXnull, this.absPos["absY"] + cYnull, 32, 32);
		}
		else if(this.mode == 1) {
			ctx.drawImage(this.playersprite, this.fightFrame*44, this.mode*44, 44, 44, this.absPos["absX"] + cXnull-5, this.absPos["absY"] + cYnull-5, 32, 32);
		}*/
		ctx.drawImage(this.playersprite, this.frame*42, this.dir*43, 42, 43, this.absPos["absX"] + cXnull, this.absPos["absY"] + cYnull, 32, 32);
	
		var hitDelta = Date.now() - this.lastHitPointUpdate;
		
		if(this.hitArray.length > 0 && hitDelta > 50) {
			for(var i = 0, j = this.hitArray.length; i < j; i+=1) {
				if(this.hitArray[i] != null) {
					this.lastHitPointUpdate = Date.now();
					this.hitArray[i][1] = Math.round((this.hitArray[i][1]-0.1)*10)/10;
			
					if(this.hitArray[i][1] <= 0) {
						this.hitArray.splice(i,1);
					}
				}
			}
		}
		else if(this.hitArray.length == 0) {
			this.gotHit = false;
		}
	
		if(this.hitArray.length > 0) {
			for(var i = 0, max = this.hitArray.length; i < max; i += 1) {
				ctx.fillStyle = 'rgba(255,0,0,'+this.hitArray[i][1]+')';
				ctx.font = "14pt Minecraftia";
				ctx.fillText(this.hitArray[i][0], this.pos["x"]+12, this.pos["y"]-20);
			}
		}
	},
});
