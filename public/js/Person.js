var Person = Class.extend({
	init: function(x, y) {
		self = this;
		self.x = x;
		self.y = y;
	},
	call: function() {
		alert("Person, x:"+self.x+", y: "+self.y);
	}
});
