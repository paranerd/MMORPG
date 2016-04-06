function SoundManager() {
	this.audioPath = "sounds/";
	this.sounds = {};
	this.soundNames = ["loot", "sword", "hurt", "potion", "coins", "walk"];

	this.loadSound = function(soundName) {
		var path = this.audioPath + soundName + ".ogg";
		var sound = document.createElement('audio');
		sound.preload = "auto";
		sound.autobuffer = true;
		sound.src = path;
		sound.load();

		this.sounds[soundName] = sound;
	};

	this.getSound = function(soundName) {
		return this.sounds[soundName];
	};

	this.playSound = function(soundName) {
		var sound = this.getSound(soundName);
		if(sound) {
			sound.pause();
			sound.currentTime = 0;
			sound.play();
		}
	};
	
	for(var i = 0, max = this.soundNames.length; i < max; i += 1) {
		this.loadSound(this.soundNames[i]);
	}
}