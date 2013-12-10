var Npc = function(startX, startY, ID, hasQuest, qID) {
	var x = startX,
		y = startY,
		id = ID,
		quest = hasQuest,
		questID = qID,
		size = 32;

	// Getters and setters
	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};

	var getID = function() {
		return id;
	};

	var hasQuest = function() {
		return quest;
	};

	var getQuestID = function() {
		return questID;
	};

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};

	// Draw enemy
	var draw = function(ctx) {
		ctx.fillRect(x, y, size, size);
	};

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		getID: getID,
		setX: setX,
		setY: setY,
		hasQuest: hasQuest,
		getQuestID: getQuestID,
		draw: draw
	}
};
exports.Npc = Npc;
