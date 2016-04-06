// Format: [description, type (0=kill, 1=collect), id(enemy or item), target, itemReward, coinReward]
var questlist = [
	{desc: "Kill 2 Bats", type: 20, id: 0, target: 2, itemReward: 11, coinReward: 500},
	{desc: "Kill 3 Bats", type: 20, id: 1, target: 3, itemReward: 11, coinReward: 100},
	{desc: "Get a Potion", type: 10, id: 2, target: 1, itemReward: 10, coinReward: 200}
];

exports.questlist = questlist;