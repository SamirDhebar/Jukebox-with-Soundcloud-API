/* globals $, SC */

/**
 * Jukebox Singleton
 */
var Jukebox = {
	songs: [],
	activeSong: null,
	volume: 100,
	isPlaying: false,
	dom: {},

	/**
	 * This function caches all selectors, binds all events, and does the initial
	 * render. Should be run once to kick off the jukebox.
	 */
	start: function() {
		// Initialize the SoundCloud API
		SC.initialize({ client_id: "fd4e76fc67798bfa742089ed619084a6" });

		// Grab the dom elements
		this.dom = {
			play: $(".jukebox-controls-play"),
			stop: $(".jukebox-controls-stop"),
			next: $(".jukebox-controls-next"),
			prev: $(".jukebox-controls-previous"),
			mute: $(".jukebox-controls-mute"),
			upload: $(".jukebox-header-upload input"),
			songs: $(".jukebox-songs"),
		};

		// Queue up some default songs
		this.addSong("./songs/Odesza-Bloom.mp3", {
			title: "Bloom",
			artist: "Odesza",
		});
		this.addSong("./songs/Sleepwalking.mp3", {
			title: "Sleepwalking",
			artist: "The Chain Gang of 1974",
		});
		this.addSong("./songs/PrettyLights-FinallyMoving.mp3", {
			title: "Finally Moving",
			artist: "Pretty Lights",
		});
		this.addSong("https://soundcloud.com/neelmonsta/kehna-hi-kya-ountdown");
		this.change(this.songs[0]);

		// Render and bind!
		this.render();
		this.listen();
	},

	/**
	 * Binds all event listeners. Must run `start()` before running this.
	 */
	listen: function() {
		this.dom.play.on("click", function() {
			if (this.isPlaying) {
				this.pause();
			}
			else {
				this.play();
			}
		}.bind(this));

		this.dom.mute.on("click", function() {
			this.setVolume(0);
		}.bind(this));

		this.dom.next.on("click", function() {
			this.skip(1);
		}.bind(this));

		this.dom.prev.on("click", function() {
			this.skip(-1);
		}.bind(this));

		this.dom.stop.on("click", this.stop.bind(this));

		this.dom.upload.on("change", function() {
			var files = this.dom.upload.prop("files");
			console.log(files);

			for (var i = 0; i < files.length; i++) {
				var file = URL.createObjectURL(files[i]);
				this.addSong(file, {
					title: "Uploaded song",
					artist: "Unknown",
				});
			}
		}.bind(this));
	},

	/**
	 * Updates the state of the DOM to match the state of the Jukebox. Must run
	 * `start()` before running this.
	 */
	render: function() {
		// Render song elements
		this.dom.songs.html("");
		for (var i = 0; i < this.songs.length; i++) {
			var $song = this.songs[i].render();
			this.dom.songs.append($song);

			if (this.songs[i] === this.activeSong) {
				$song.addClass("isActive");
			}
		}

		// Indicate paused vs played
		this.dom.play.toggleClass("isPlaying", this.isPlaying);
		this.dom.stop.toggleClass("isDisabled", !this.isPlaying);
	},

	play: function(song) {
		if (song) {
			this.change(song);
		}

		if (!this.activeSong) {
			return null;
		}

		this.isPlaying = true;
		this.activeSong.play();
		this.render();
		return this.activeSong;
	},

	pause: function() {
		if (!this.activeSong) {
			return null;
		}

		this.isPlaying = false;
		this.activeSong.pause();
		this.render();
		return this.activeSong;
	},


	stop: function() {
		if (!this.activeSong) {
			return false;
		}

		this.activeSong.stop();
		this.isPlaying = false;
		this.render();
		return this.activeSong;
	},


	change: function(song) {
		if (this.activeSong) {
			this.activeSong.stop();
		}

		this.activeSong = song;
		this.render();
		return this.activeSong;
	},


	skip: function(direction) {
		if (!this.activeSong) {
			return false;
		}

		// Find the current song's index
		var idx = this.songs.indexOf(this.activeSong);

		// Set the desired index by adding the direction, and limiting it to the
		// length of the array using a modulous operator
		var desiredIndex = (idx + direction) % this.songs.length;

		// Change to the desired song
		return this.change(this.songs[desiredIndex]);
	},

	/**
	 * Shuffle the order of music.
	 */
	shuffle: function() {
		console.log("Jukebox is shuffling");
	},

	/**
	 */
	 addSong: function(file, meta) {
 		var song;

 		if (file.indexOf("soundcloud.com") !== -1) {
 			song = new SoundCloudSong(file);
 		}
 		else {
 			song = new FileSong(file, meta);
 		}

 		this.songs.push(song);

 		var $song = song.render();
 		this.dom.songs.append($song);
 		this.render();

 		return song;
 	},

	// volumeLevel should be a number between 0-100
	setVolume: function(volumeLevel) {
		this.volume = volumeLevel;
	},
};


/**
 * Song Class
 */
class Song {
 	/**
 	 * Create a new song.
 	 */
 	constructor() {
 		this.file = null;
 		this.meta = {};
 		this.audio = null;
 		this.$song = $('<div class="jukebox-songs-song"></div>');
 		this.$song.data("song", this);
 	}

	/**
	 * Render the song as markup. Need to FINALIZE BELOW
	 */
	render() {
		var $song = $('<div class="jukebox-songs-song"></div>');
		$song.append('<div class="jukebox-songs-song-pic"></div>');
		$song.append('<div class="jukebox-songs-song-title">' + this.meta.title + '</div>');
		$song.append('<div class="jukebox-songs-song-artist">' + this.meta.artist + '</div>');
		$song.data("song", this);
		return this.$song;
	}

	/**
	 * Play the song.
	 */
	play() {
		this.audio.play();
	}

	/**
	 * Pause the song.
	 */
	pause() {
		this.audio.pause();
	}

	/**
	 * Stop the song, resetting it to the start.
	 */
	stop() {
		this.audio.pause();
		this.audio.currentTime = 0;
	}
}
/**
 * FileSong Class
 */
class FileSong extends Song {

	constructor(file, meta) {
		super();
		this.file = file;
		this.meta = meta || {
			title: "Unknown title",
			artist: "Unknown artist",
		};
		this.audio = new Audio(file);
	}
}

/**
 * SoundCloudSong Class
 */
class SoundCloudSong extends Song {

	constructor(url) {

		// Convert the URL to an object with metadata from the API
		SC.resolve(url)
			// Assign that metadata to the song object
			.then(function(song) {
				this.meta = {
					title: song.title,
					artist: song.user.username,
				};
				return song;
			}.bind(this))
			// Create the Audio instance from the song's uri
			.then(function(song) {
				var uri = song.uri + "/stream?client_id=fd4e76fc67798bfa742089ed619084a6";
				this.audio = new Audio(uri);
			}.bind(this))
			// Render our song with all that sweet sweet data
			.then(function() {
				this.render();
			}.bind(this));
	}
}



super();
$(document).ready(function() {
	Jukebox.start();
});
