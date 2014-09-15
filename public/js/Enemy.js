var Enemy = function(startX, startY, ID, typ) {
	var x = startX,
		y = startY,
		maxhp = 100,
		currhp = maxhp,
		id = ID,
		level = 1,
		alive = true,
		gotHit = false,
		hitArray = [],
		xp = 4,
		baseXP = 39,
		type = typ,
		lastHitPointUpdate = Date.now(),
		size = 32;

	var enemysprite = new Image();
	enemysprite.src = 'sprites/spritesheet.png';

	// Getters and setters
	var getX = function() {
		return x;
	};

	var xpToGive = function() {
		return (baseXP * level) / 7;
	};

	var getY = function() {
		return y;
	};

	var getXP = function() {
		return xp;
	};

	var getType = function() {
		return type;
	};

	var getCurrHP = function() {
		return currhp;
	};

	var getHurt = function(amount) {
		currhp -= amount;
		if(currhp < 0) {
			currhp = 0;
		}
		gotHit = true;
		hitArray.push([amount, 1.0]);
	};

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};

	var killed = function() {
		alive = false;
		hitArray = [];
	};

	var setAlive = function() {
		alive = true;
		currhp = maxhp;
	};

	var isAlive = function() {
		return alive;
	};

	// Display stats
	var displayStats = function() {
		// Level
		$("#enemyLevel").removeClass('hideClass');
		$("#enemyLevel").html(level);

		// Health
		var width = 146*(currhp/maxhp) + "px";
		$("#enemyHeart").removeClass('hideClass');
		$("#enemyName").removeClass('hideClass');
		$("#enemyHealthBorder").removeClass('hideClass');
		$("#enemyHealth").removeClass('hideClass');
		$("#enemyHealth").width(width);
	}

	// Draw
	var draw = function(ctx, cXnull, cYnull) {
		ctx.fillStyle = "#00F";
		ctx.strokeStyle = "#F00";
		ctx.font = "10pt Arial";
		ctx.drawImage(enemysprite, 32, 0, 32, 32, x+cXnull, y+cYnull, 32, 32);

		var hitDelta = Date.now() - lastHitPointUpdate;
	
		if(hitArray.length > 0 && hitDelta > 50) {
			for(var i = 0, j = hitArray.length; i < j; i+=1) {
				if(hitArray[i] != null) {
					lastHitPointUpdate = Date.now();
					hitArray[i][1] = Math.round((hitArray[i][1]-0.1)*10)/10;
		
					if(hitArray[i][1] <= 0) {
						//gotHit = false;
						hitArray.splice(i,1);
					}
				}
			}
		}
		else if(hitArray.length == 0) {
			gotHit = false;
		}
		//console.log("Enemy hitArray.length: "+hitArray.length);
		if(hitArray.length > 0) {
			for(var i = 0, j = hitArray.length; i < j; i+=1) {
				ctx.fillStyle = 'rgba(0,255,0,'+hitArray[i][1]+')';//"#F00";
				ctx.strokeStyle = "#F00";
				ctx.font = "14pt Minecraftia";
				ctx.fillText(hitArray[i][0], x+cXnull+12, y+cYnull-20);
			}
		}
	};

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		getXP: getXP,
		getCurrHP: getCurrHP,
		getHurt: getHurt,
		setX: setX,
		setY: setY,
		draw: draw,
		killed: killed,
		setAlive: setAlive,
		isAlive: isAlive,
		getType: getType,
		displayStats: displayStats
	}
};
