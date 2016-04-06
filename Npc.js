function Npc(id, x, y, name, questID) {
	this.id = id,
	this.x = x,
	this.y = y,
	this.name = name;
	this.questID = questID,
	this.size = 32,
	this.conversation = [
		[["I need your help", "Please kill 2 bats for me"], ["You better hurry!"], ["I don't know how to thank you!"]],
		[["Hi there", "I am NCP number 2"]],
		[["You should collect a potion!"], ["Did you find one?"], ["Hope you feel better now!"]],
		[["The Bats are attacking me!!!", "Help me by killing 3 of 'em, please!"], ["Are you done yet?"], ["That was so awesome!"]],
		[["Hello", "How are you?", "Nice weather today, isn't it?!"]]
	];
}
exports.Npc = Npc;
