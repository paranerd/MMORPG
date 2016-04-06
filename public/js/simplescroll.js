var simpleScroll = {
	startscroll: false,
	scrollpercent: 0,
	diff: 0,
	autoScrollBottom: true,
	self: null,
	container: null,
	
	init: function(id) {
		self = this;
		self.container = document.getElementById(id);
		
		if(self.container == null) {
			return;
		}
		
		var content = self.container.innerHTML;

		self.container.innerHTML = "";
		
		var innerNode = document.createElement("div");
		innerNode.id = "simpleScrollContainer";
		innerNode.style.width = self.container.style.width;
		innerNode.style.height = self.container.style.height;
		innerNode.style.color = self.container.style.color;
		innerNode.style.overflow = "hidden";
		innerNode.innerHTML = content;
		
		self.container.appendChild(innerNode);

		var scrolly = document.createElement("div");
		scrolly.id = "scrollbar";
		scrolly.style.position = "absolute";
		scrolly.style.top = "0px";
		scrolly.style.right = "5px";
		scrolly.style.height = "0%";
		scrolly.style.width = "5px";
		scrolly.style.backgroundColor = "#aaa";
		scrolly.style.borderRadius = "3px";
		
		self.container.appendChild(scrolly);

		// Register event callbacks
		scrollbar.onmousedown = function(e) {
			self.startscroll = true;
			self.diff = parseInt(scrollbar.style.top) - e.pageY;
			simpleScrollContainer.style["MozUserSelect"] = "none";
		}
		
		document.onmouseup = function() {
			self.startscroll = false;
			simpleScrollContainer.style["MozUserSelect"] = "all";
		}
		
		document.onmousemove = function(e) {
			if(self.startscroll) {
				self.scrollpercent = (e.pageY + self.diff) / (parseInt(self.container.style.height) - parseInt(scrollbar.style.height));
				simpleScrollContainer.scrollTop = (simpleScrollContainer.scrollHeight - parseInt(self.container.style.height)) * self.scrollpercent;
				
				scrollbar.style.top = (parseInt(self.container.style.height) - parseInt(scrollbar.style.height)) * (simpleScrollContainer.scrollTop / (simpleScrollContainer.scrollHeight - parseInt(self.container.style.height))) + "px";
			}
		}
		
		self.update();
	},
	
	append: function(html) {
		if(self.container == null) {
			return;
		}
		
		simpleScrollContainer.innerHTML += html;
		self.update();
	},

	update: function() {	
		if(self.container == null) {
			return;
		}

		// Put scrollbar where it belongs	
		scrollbar.style.height = (parseInt(self.container.style.height) / parseInt(simpleScrollContainer.scrollHeight)) * parseInt(self.container.style.height) + "px";
		if(self.autoScrollBottom) {
			simpleScrollContainer.scrollTop = parseInt(simpleScrollContainer.scrollHeight) - parseInt(self.container.style.height);
		}

		scrollbar.style.top = (parseInt(self.container.style.height) - parseInt(scrollbar.style.height)) * (parseInt(simpleScrollContainer.scrollTop) / (parseInt(simpleScrollContainer.scrollHeight) - parseInt(self.container.style.height))) + "px";

		if(parseInt(scrollbar.style.height) == parseInt(simpleScrollContainer.scrollHeight)) {
			scrollbar.style.display = "none";
		}
		else {
			scrollbar.style.display = "block";
		}
	}
}