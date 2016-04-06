function Player(x, y, name, hp, id, dir) {
	this.pos = {x: x, y: y};
	this.name = name;
	this.currhp = hp;

	this.sound = new SoundManager();
	this.id = id;
	this.level = 1;
	this.levelBorders = [0, 5, 15, 30, 50];
	this.dir = dir;
	this.frame = 0;
	this.alive = true;
	this.maxhp = 100;
	this.xp = 0;
	this.finalDir;
	this.fightFrame = 0;
	this.money = 0;
	this.moving = false;
	this.path = [[]];
	this.speed = 200;
	this.hitSpeed = 500;
	this.lastStrike = 0;
	this.moveInterrupt = false;
	this.goToNpc = null;
	this.talkingTo = null;
	this.goFight = null;
	this.fighting = null;
	this.strength = 50;
	this.gotHit = false;
	this.hitArray = [];
	this.inventory = [];
	this.inventoryMax = 18;
	this.tileSize;
	this.conversation = [];
	this.lastHitPointUpdate = Date.now();
	this.lastHitUpdate = Date.now();
	this.lastFrameUpdate = Date.now();
	this.openQuests = [];
	this.pendingQuest = null;
	this.stop = false;
	this.stepSnd = new Audio("sounds/walk.ogg");

	this.xpForLevel = function(level) {
		return level*level*level;
	};

	this.getHurt = function(amount) {
		this.currhp -= amount;
		this.sound.playSound("hurt");

		if(this.currhp <= 0) {
			this.currhp = 0;
			this.alive = false;
		}
		this.gotHit = true;
		this.hitArray.push([amount, 1.0]);
	};

	this.addQuest = function(quest) {
		for(var i = 0; i < this.openQuests.length; i++) {
			if(this.openQuests[i].quest.type == quest.type && this.openQuests[i].quest.id == quest.id) {
				return;
			}
		}
		
		this.pendingQuest = quest;
	};

	this.updateQuest = function(type, amount) {
		for(var i = 0; i < this.openQuests.length; i++) {
			if(this.openQuests[i].quest.type == type) {
				this.openQuests[i].amount += amount;
				if(this.openQuests[i].amount >= this.openQuests[i].quest.target) {
					this.openQuests[i].status = 2;
				}
			}
		}
	};
	
	this.confirmQuest = function() {
		this.openQuests.push({quest: this.pendingQuest, amount: 0, status: 1});
		this.pendingQuest = null;
		this.talkingTo = null;
	};

	this.declineQuest = function() {
		this.pendingQuest = null;
		this.talkingTo = null;
	};

	this.addXP = function(amount) {
		this.xp += amount;
		if(this.xp >= this.xpForLevel(this.level)) {
			this.level += 1;
		}
	};

	this.isGoingToFight = function() {
		return this.goFight;
	};

	this.setGoToNpc = function(npc) {
		this.goToNpc = npc.id;
		this.talkingTo = null;
		
		this.goFight = null;
		this.fighting = null;
		
		this.conversation = [];
		for(var i = 0; i < npc.conversation[npc.id].length; i++) {
			this.conversation.push(npc.conversation[npc.id][i].slice());
		}
	};
	
	this.justWalk = function() {
		this.goToNpc = null;
		this.talkingTo = null;
		this.goFight = null;
		this.fighting = null;
	};

	this.setGoFight = function(value) {
		this.goFight = value;
		this.goToNpc = null;
		this.talkingTo = null;
		
		if(value == null) {
			this.fighting = null;
		}
	};
	
	this.getConversation = function(npc) {
		if(npc.questID != null) {
			for(var j = 0; j < this.openQuests.length; j++) {
				if(this.openQuests[j].quest.id == npc.questID) {
					return {sec: this.openQuests[j].status, text: this.conversation[this.openQuests[j].status].shift()};
				}
			}
		}
		return {sec: 0, text: this.conversation[0].shift()};
	};

	this.setPath = function(path) {
		this.path = path;
		this.moving = true;

		if(this.path[this.path.length-1][0] > this.path[this.path.length-2][0]) {
			this.finalDir = 1;
		}
		else if(this.path[this.path.length-1][0] < this.path[this.path.length-2][0]) {
			this.finalDir = 3;
		}
		else if(this.path[this.path.length-1][1] > this.path[this.path.length-2][1]) {
			this.finalDir = 2;
		}
		else if(this.path[this.path.length-1][1] < this.path[this.path.length-2][1]) {
			this.finalDir = 0;
		}
		
		if(this.goFight != null || this.goToNpc != null) {
			this.path.pop();
		}
	};

	this.playSwordSound = function() {
		this.sound.playSound("sword");
	};

	this.useItem = function(box) {
		var inventory = this.inventory;
		var boxID = ($(box).attr('id').substring(3));
		if(this.inventory[boxID] != null) {
			if(this.inventory[boxID].item.type == 10 && this.currhp < this.maxhp) {
				this.sound.playSound("potion");
				this.currhp += this.inventory[boxID].quantity;
				if(this.currhp > this.maxhp) {
					this.currhp = this.maxhp;
				}
			}

			// Decrease amount of that item
			this.inventory[boxID].quantity--;
			
			if(this.inventory[boxID].quantity == 0) {
				this.inventory.splice(boxID, 1);
			}
		}
	};

	this.takeItem = function(item, quantity) {
		var itemPath;
		var hasItem = false;

		if(item.type == 11) {
			this.money += quantity;
			this.sound.playSound("coins");
			return;
		}

		// Search inventory for that item
		for(var i = 0; i < this.inventory.length; i++) {
			if(this.inventory[i].item.type == item.type) {
				this.inventory[i].quantity++;
				hasItem = true;
				break;
			}
		}

		// Add new item to inventory
		if(!hasItem && this.inventory.length < this.inventoryMax) {
			this.inventory.push({item: item, quantity: 1});
		}

		// Play loot.ogg
		this.sound.playSound("loot");
		
		this.updateQuest(item.type, 1);
	};

	this.playerMove = function (dt) {
		if(this.stepSnd.paused) {
			this.stepSnd.currentTime = 0;
			this.stepSnd.play();
		}

		// Moving left
		if(this.path[0][0] * this.tileSize < this.pos.x) {
			this.dir = 3;
			this.pos.x -= Math.round(this.speed * dt);

			if(this.path[0][0] * this.tileSize >= this.pos.x) {
				this.pos.x = this.path[0][0] * this.tileSize;
			}
		}
		// Moving right
		else if(this.path[0][0] * this.tileSize > this.pos.x) {
			this.dir = 1;

			this.pos.x += Math.round(this.speed * dt);

			if(this.path[0][0] * this.tileSize <= this.pos.x) {
				this.pos.x = this.path[0][0] * this.tileSize;
			}
		}
		// Moving up
		else if(this.path[0][1] * this.tileSize < this.pos.y) {
			this.dir = 0;

			this.pos.y -= Math.round(this.speed * dt);

			if(this.path[0][1] * this.tileSize >= this.pos.y) {
				this.pos.y = this.path[0][1] * this.tileSize;
			}
		}
		// Moving down
		else if(this.path[0][1] * this.tileSize > this.pos.y) {
			this.dir = 2;

			this.pos.y += Math.round(this.speed * dt);

			if(this.path[0][1] * this.tileSize <= this.pos.y) {
				this.pos.y = this.path[0][1] * this.tileSize;
			}
		}
		
		if (this.path[0][0] * this.tileSize == this.pos.x &&
			this.path[0][1] * this.tileSize == this.pos.y)
		{
			// Next tile-step
			if(this.path.length > 1 && !this.moveInterrupt) {
				this.path.shift();
			}
			// End of path
			else {
				if(this.goFight != null) {
					this.fighting = this.goFight;
				}
				else if(this.goToNpc != null) {
					this.talkingTo = this.goToNpc;
				}

				this.moving = false;
				this.stepSnd.pause();
				this.dir = this.finalDir;
			}
		}
	};
}