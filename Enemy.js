var cls = require("./Class").Class;
var Enemy = cls.extend({
	init: function(startX, startY, ID, typ) {
		this.x = startX;
		this.y = startY;
		this.maxhp = 100;
		this.currhp = this.maxhp;
		this.strength = 5;
		this.id = ID;
		this.level = 1;
		this.killTime = 0;
		this.alive = true;
		this.xp = 4;
		this.type = typ;
		this.baseXP = 39;
		this.def = 10;
		this.hitSpeed = 900;
		this.respawnTime = 3000;
		this.fighting = false;
		this.fightingPlayers = [];
		this.lastStrike = 0;
		this.size = 32;
	},

	getX: function() {
		return this.x;
	},

	getY: function() {
		return this.y;
	},

	getID: function() {
		return this.id;
	},

	getXP: function() {
		return (this.baseXP * this.level) / 7;
	},

	getDef: function() {
		return this.def;
	},

	getCurrHP: function() {
		return this.currhp;
	},

	getStrength: function() {
		return this.strength;
	},

	getRespawnTime: function() {
		return this.respawnTime;
	},

	getHitSpeed: function() {
		return this.hitSpeed;
	},

	getHurt: function(amount) {
		this.currhp -= amount;
		if(this.currhp < 0) {
			this.alive = false;
			this.currhp = 0;
			this.killTime = Date.now();
			this.fighting = false;
			this.fightingPlayers = [];
		}
	},

	getType: function() {
		return this.type;
	},

	getLastStrike: function() {
		return this.lastStrike;
	},

	isFighting: function() {
		return this.fighting;
	},

	readyToHit: function() {
		return (this.fighting && (Date.now() - this.lastStrike > this.hitSpeed));
	},

	killedPlayer: function() {
		this.fightingPlayers.shift();
		//if(fightingPlayers.length == 0) {
			this.fighting = false;
		//}
	},

	fightingAgainst: function() {
		return this.fightingPlayers[0];
	},

	getKilltime: function() {
		return this.killTime;
	},

	getXP: function() {
		return this.xp;
	},

	setLastStrike: function(time) {
		this.lastStrike = time;
	},

	setX: function(newX) {
		this.x = newX;
	},

	setY: function(newY) {
		this.y = newY;
	},

	setAlive: function() {
		this.alive = true;
		this.currhp = this.maxhp;
	},

	setFightingTrue: function(playerID) {
		this.fighting = true;
		this.fightingPlayers.push(playerID);
	},

	setFightingFalse: function() {
		this.fighting = false;
	},

	isAlive: function() {
		return this.alive;
	}
});

// Export the Enemy class so you can use it in
// other files by using require("Enemy").Enemy
exports.Enemy = Enemy;
