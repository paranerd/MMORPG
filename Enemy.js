function Enemy(x, y, ID, typ) {
	this.x = x;
	this.y = y;
	this.maxhp = 100;
	this.currhp = this.maxhp;
	this.strength = 5;
	this.id = ID;
	this.level = 1;
	this.killTime = 0;
	this.alive = true;
	this.type = typ;
	this.baseXP = 39;
	this.def = 10;
	this.hitSpeed = 900;
	this.respawnTime = 3000;
	this.fightingPlayers = [];
	this.lastStrike = 0;
	this.size = 32;
	this.hitArray = [];

	this.getXP = function() {
		return (this.baseXP * this.level) / 7;
	};

	this.getHurt = function(amount) {
		this.currhp -= amount;
		this.hitArray.push([amount, 1.0]);
		if(this.currhp < 0) {
			this.alive = false;
			this.currhp = 0;
			this.killTime = Date.now();
			this.fightingPlayers = [];
			this.hitArray = [];
		}
	};

	this.readyToHit = function() {
		return (this.fightingPlayers.length > 0 && (Date.now() - this.lastStrike > this.hitSpeed));
	};

	this.killedPlayer = function() {
		this.fightingPlayers.shift();
	};

	this.fightingAgainst = function() {
		return (this.fightingPlayers.length > 0) ? this.fightingPlayers[0] : null;
	};

	this.setLastStrike = function(time) {
		this.lastStrike = time;
	};

	this.setAlive = function() {
		this.alive = true;
		this.currhp = this.maxhp;
	};

	this.startFight = function(playerID) {
		this.fightingPlayers.push(playerID);
	};

	this.stopFight = function() {
		this.fightingPlayers = [];
	};
}

// Export the Enemy class so you can use it in
// other files by using require("Enemy").Enemy
exports.Enemy = Enemy;
