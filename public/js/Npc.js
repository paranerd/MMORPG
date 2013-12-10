var Npc = function(startX, startY, ID, hasQuest, qID) {
	var x = startX,
		y = startY,
		id = ID,
		quest = hasQuest,
		questID = qID,
		size = 32;

	var conversation = [
		["Hello", "How are you?", "Nice weather today, isn't it?!"],
		["Hi there", "I am NCP number 2"]
	];

	var npcsprite = new Image();
	npcsprite.src = 'sprites/npc.png';

	// Getters and setters
	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};

	var hasQuest = function() {
		return quest;
	};

	var getQuestID = function() {
		return questID;
	};

	var getConversation = function(npc) {
		return conversation[npc];
	};

	// Draw
	var draw = function(ctx, cXnull, cYnull) {
		ctx.drawImage(npcsprite, 44, 0, 44, 44, x+cXnull, y+cYnull, 32, 32);
	};

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		getConversation: getConversation,
		hasQuest: hasQuest,
		getQuestID: getQuestID,
		draw: draw
	}
};
