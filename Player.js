function Player(startX, startY, pName, hp, id) {
	this.pos = {x: startX, y: startY};
	this.dir = 2;
	this.alive = true;
	this.maxhp = 100;
	this.money = 0;
	this.currhp = hp;
	this.name = pName;
	this.goFight = null;
	this.fighting = null;
	this.strength = 50;
	this.lastStrike = 0;
	this.hitSpeed = 500;
	this.id = id;
	this.tileSize = 0;

	this.xpForLevel = function(level) {
		return level*level*level;
	};

	this.getLastStrike = function() {
		return this.lastStrike;
	};

	this.getCurrHP = function() {
		return this.currhp;
	};

	this.getHurt = function(amount) {
		this.currhp -= amount;
		if(this.currhp < 0) {
			this.currhp = 0;
			this.alive = false;
		}
	};

	this.setLastStrike = function(time) {
		this.lastStrike = time;
	};
	
	this.setGoFight = function(value) {
		this.goFight = value;
		//this.goToNpc = null;
		//this.talkingTo = null;
		
		if(value == null) {
			this.fighting = null;
		}
	};
	
	this.stopFight = function() {
		this.goFight = null;
		this.fighting = null;
	};

	this.inFight = function(enemyID) {
		this.fighting = enemyID;
	};

	this.readyToHit = function() {
		return (this.fighting != null && (Date.now() - this.lastStrike > this.hitSpeed));
	};

	this.takeItem = function(type, change) {
		if(type == 0) {
			this.currhp += change;
		}
		else if(type == 1) {
			this.money += change;
		}
	};
}

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;