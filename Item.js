function Item(id, type, x, y, quantity) {
	this.id = id;
	this.type = type;
	this.x = x;
	this.y = y;
	this.quantity = quantity;
	this.descriptions = ["Potion</br>Regenerates 20 HP"];
	this.desc = this.descriptions[this.type - 10];
}

exports.Item = Item;