var SoundManager = Class.extend({
	init: function() {
		this.audioPath = "sounds/";
		this.sounds = {};
		this.soundNames = ["loot", "sword", "hurt", "potion", "coins", "walk"];

		for(var i = 0, max = this.soundNames.length; i < max; i += 1) {
			this.loadSound(this.soundNames[i]);
		}
	},

	loadSound: function(soundName) {
		var path = this.audioPath + soundName + ".ogg";
		var sound = document.createElement('audio');
		sound.preload = "auto";
		sound.autobuffer = true;
		sound.src = path;
		sound.load();

		this.sounds[soundName] = sound;
	},

	getSound: function(soundName) {
		// var sound = this.sounds[soundName].paused();
		// return sound;
		return this.sounds[soundName];
	},

        playSound: function(soundName) {
		var sound = this.getSound(soundName);
		if(sound) {
			sound.pause();
			sound.currentTime = 0;
			sound.play();
		}
	}
});
