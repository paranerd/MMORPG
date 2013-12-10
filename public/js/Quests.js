/* ======
   Quests
   ====== */
var Quests = function() {
	// Format: [description, type (0=kill, 1=collect), id(enemy or item), target, itemReward, coinReward]
	questList = [
		["Kill 2 Bats", 0, 0, 2, 0, 500],
		["Kill 3 Bats", 0, 0, 3, 0, 100],
		["Get a Potion", 1, 0, 1, 1, 200]
	];

	// Format: [questAvailConv, questPendingConv, questCompleteConv]
	questConv = [
		[["I need your help", "Please kill 2 bats for me"], ["You better hurry!"], ["I don't know how to thank you!"]],
		[["The Bats are attacking me!!!", "Help me by killing 3 of 'em, please!"], ["Are you done yet?"], ["That was so awesome!"]],
		[["You should collect a potion!"], ["Did you find one?"], ["Hope you feel better now!"]]
	];

	getQuestConv = function(id, status) {
		return questConv[id][status];
	};

	getQuest = function(id) {
		return questList[id];
	};

	return {
		getQuest: getQuest,
		getQuestConv: getQuestConv
	}
};
