/**************************************************
** GAME PLAYER CLASS
**************************************************/
var cls = require("./Class").Class;
var Player = cls.extend({
	init: function(startX, startY, pName, hp, id) {
		this.x = startX;
		this.absX = this.x;
		this.y = startY;
		this.absY = this.y;
		this.dir = 2;
		this.alive = true;
		this.maxhp = 100;
		this.money = 0;
		this.currhp = hp;
		this.playerName = pName;
		this.canvasXnull = 0;
		this.canvasYnull = 0;
		this.goAttack = false;
		this.fighting = false;
		this.strength = 50;
		this.lastStrike = 0;
		this.hitSpeed = 500;
		this.playerAttacksEnemyID = null;
		this.id = id;
	},

	// Getters and setters
	getX: function() {
		return this.x;
	},

	getAbsX: function() {
		return this.absX;
	},

	getY: function() {
		return this.y;
	},

	getAbsY: function() {
		return this.absY;
	},

	xpForLevel: function(level) {
		return level*level*level;
	},

	getID: function() {
		return this.id;
	},

	getName: function() {
		return this.playerName;
	},

	getRestart: function() {
		return this.restart;
	},

	getDir: function() {
		return this.dir;
	},

	getCanvasXnull: function() {
		return this.canvasXnull;
	},

	getCanvasYnull: function() {
		return this.canvasYnull;
	},

	getStrength: function() {
		return this.strength;
	},

	getEnemyID: function() {
		return this.playerAttacksEnemyID;
	},

	getLastStrike: function() {
		return this.lastStrike;
	},

	getHitSpeed: function() {
		return this.hitSpeed;
	},

	getCurrHP: function() {
		return this.currhp;
	},

	getHurt: function(amount) {
		this.currhp -= amount;
		if(this.currhp < 0) {
			this.currhp = 0;
			this.alive = false;
		}
	},

	isAlive: function() {
		return this.alive;
	},

	setLastStrike: function(time) {
		this.lastStrike = time;
	},

	setID: function(id) {
		this.id = id;
	},

	isGoingToFight: function() {
		return (this.goAttack || this.fighting);
	},

	isFighting: function() {
		return this.fighting;
	},

	setEnemyID: function(id) {
		this.playerAttacksEnemyID = id;
	},

	setX: function(newX) {
		this.x = newX;
	},

	setAbsX: function(newX) {
		this.absX = newX;
	},

	setY: function(newY) {
		this.y = newY;
	},

	setAbsY: function(newY) {
		this.absY = newY;
	},

	setRestart: function(bool) {
		this.restart = bool;
	},

	setDirection: function(direction) {
		this.dir = direction;
	},

	setCanvasXnull: function(x) {
		this.canvasXnull = x;
	},

	setCanvasYnull: function(y) {
		this.canvasYnull = y;
	},

	setGoAttackTrue: function() {
		this.goAttack = true;
	},

	setGoAttackFalse: function() {
		this.goAttack = false;
		this.fighting = false;
	},

	inFight: function() {
		this.fighting = true;
	},

	readyToHit: function() {
		return (this.fighting && (Date.now() - this.lastStrike > this.hitSpeed));
	},

	takeItem: function(type, change) {
		if(type == 0) {
			this.currhp += change;
		}
		else if(type == 1) {
			this.money += change;
		}
	}
});

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;
