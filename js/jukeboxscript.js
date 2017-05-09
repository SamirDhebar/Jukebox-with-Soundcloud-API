/* globals $, SC */

/**
 * Jukebox Singleton
 * @namespace
 * @property {array} songs - List of songs available in the app
 * @property {Song} activeSong - The song currently selected
 * @property {number} volume - Number between 1 and 100, the current volume
 * @property {boolean} isPlaying - Whether or not the activeSong is playing
 * @property {object} dom - Cached dom elements relevant to Jukebox
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
			modalOpenBtn: $(".js-openmodal"),
			modalCloseBtn: $(".js-closemodal"),
			upload: $(".js-upload"),
			songs: $(".jukebox-songs"),
			modal: $(".modal"),
			artwork: $(".jukebox-songs-album-artwork"),
		};

		// Queue up some default songs
		this.addSong("./songs/Odesza-Bloom.mp3", {
			title: "Bloom",
			artist: "Odesza",
		});
		this.addSong("./songs/PrettyLights-FinallyMoving.mp3", {
			title: "Finally Moving",
			artist: "Pretty Lights",
		});
		this.addSong("./songs/Sleepwalking.mp3", {
			title: "Sleepwalking",
			artist: "The Chaingang of 1974",
		});
		// Add Soundcloud song
		// this.addSong("https://soundcloud.com/neelmonsta/kehna-hi-kya-ountdown");
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
			this.play();
		}.bind(this));

		this.dom.prev.on("click", function() {
			this.skip(-1);
			this.play();
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

			this.closeModal();
		}.bind(this));

		this.dom.songs.on("click", ".jukebox-songs-song", function(ev) {
			var song = $(ev.currentTarget).data("song");
			this.play(song);
		}.bind(this));

		this.dom.modalOpenBtn.on("click", function() {
			this.openModal();
		}.bind(this));

		this.dom.modalCloseBtn.on("click", function() {
			this.closeModal();
		}.bind(this));
	},

	/**
	 * Updates the state of the DOM to match the state of the Jukebox. Must run
	 * `start()` before running this.
	 */
	render: function() {
		// Render song elements
		for (var i = 0; i < this.songs.length; i++) {
			var $song = this.songs[i].render();

			if (this.songs[i] === this.activeSong) {
				$song.addClass("isActive");
			}
			else {
				$song.removeClass("isActive");
			}
			$('.jukebox-songs').append($song);
		}

		// Indicate paused vs played
		this.dom.play.toggleClass("isPlaying", this.isPlaying);
		this.dom.stop.toggleClass("isDisabled", !this.isPlaying);
	},

	/**
	 * Plays a song. If passed a song, sets that to the activeSong. Otherwise
	 * plays the current activeSong. If no activeSong, returns null.
	 * @param {Song} [song] - Song to play, if changing from activeSong
	 * @returns {Song} The song that was played, or null if no song played
	 */
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

	/**
	 * Pauses a song, if one is playing. Otherwise, it's a no-op.
	 * @returns {Song} The song that was paused, or null if no song played
	 */
	pause: function() {
		if (!this.activeSong) {
			return null;
		}

		this.isPlaying = false;
		this.activeSong.pause();
		this.render();
		return this.activeSong;
	},

	/**
	 * Stops the song, and sets its playing progress to zero. If no activeSong,
	 * it's a no-op.
	 * @returns {Song} The song that was stopped, or null if no song played
	 */
	stop: function() {
		if (!this.activeSong) {
			return false;
		}

		this.activeSong.stop();
		this.isPlaying = false;
		this.render();
		return this.activeSong;
	},

	/**
	 * Changes the currently active song, and stops the previous one if there was
	 * one.
	 * @param {Song} song - The new Song to be activeSong
	 * @returns {Song} The passed song param
	 */
	change: function(song) {
		if (this.activeSong) {
			this.activeSong.stop();
		}

		this.activeSong = song;
		this.render();
		return this.activeSong;
	},

	/**
	 * Skips the current song in a direction. Can skip forwards, or backwards.
	 * @param {number} direction - Positive or negative number indicating how many to skip
	 * @returns {Song} Returns the new activeSong
	 */
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
	 * Given a file and some info, add a new song.
	 * @param {string} file - Relative path, URL, or data blob string for the song
	 * @param {object} meta - Information about the song
	 * @param {string} meta.title - Name of the song
	 * @param {string} meta.artist - Name of the artist
	 * @returns {Song} The newly made song
	 */
	addSong: function(file, meta) {
		var song;
		if (file.includes("soundcloud.com")) {
			song = new SoundCloudSong(file);
		}
		else {
			song = new FileSong(file, meta);
		}

		this.songs.push(song);
		console.log(this.songs);

		var $song = song.render();
		this.dom.songs.append($song);
		// this.render();

		return song;
	},

	/**
	 * Set the volume of the music being played.
	 * @param {number} volumeLevel - Number from 0-100, muted to max respectively
	 */
	setVolume: function(volumeLevel) {
		this.volume = volumeLevel;
	},

	/**
	 * Opens the upload modal
	 */
	openModal: function() {
		this.dom.modal.addClass("isOpen");
	},

	/**
	 * Closes the upload modal
	 */
	closeModal: function() {
		this.dom.modal.removeClass("isOpen");
	},
};


/**
 * Song Class. Only meant to be extended, does not do anything on its own.
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
	 * Render the song as markup.
	 * @returns {jQuery} The song, not added to the dom yet
	 */
	render() {
		this.$song.html("");
		this.$song.append('<div class="jukebox-songs-song-pic"></div>');
		this.$song.append('<div class="jukebox-songs-song-title">' + this.meta.title + '</div>');
		this.$song.append('<div class="jukebox-songs-song-artist">' + this.meta.artist + '</div>');
		// this.$song.append('<img class="album art" src="' +	this.meta.artwork + '" />');

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
	/**
	 * Create a new song from a file (Remote or local)
	 * @param {string} file - Relative path, URL, or data blob string for the song
	 * @param {object} meta - Information about the song
	 * @param {string} meta.title - Name of the song
	 * @param {string} meta.artist - Name of the artist
	 */
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
	/**
	 * Create a new song from a SoundCloud URL. All other information is derived
	 * from SoundCloud's API.
	 * @param {string} url - Full soundcloud URL
	 */
	constructor(url) {
		super();
		console.log(url);
		console.log(this);

		// Convert the URL to an object with metadata from the API
		SC.resolve(url)
			// Assign that metadata to the song object
			.then(function(song) {
				console.log('this', song);
				this.meta = {
					title: song.title,
					artist: song.user.username,
					artwork:song.artwork_url,
					link: song.user.permalink_url,
				};
				return song;
			}.bind(this))

			// // Create the Audio instance from the song's uri
			.then(function(song) {
				var uri = song.uri + "/stream?client_id=fd4e76fc67798bfa742089ed619084a6";
				this.audio = new Audio(uri);
			}.bind(this))
			// // Render our song with all that sweet sweet data
			.then(function() {
				this.render();
			}.bind(this));
	}
	render() {
		this.$song.html("");
		this.$song.append('<div class="jukebox-songs-song-pic"></div>');
		this.$song.append('<div class="jukebox-songs-song-title">' + this.meta.title + '</div>');
		this.$song.append('<div class="jukebox-songs-song-artist">' + this.meta.artist + '</div>');
		this.$song.append('<img class="album art" src="' +	this.meta.artwork + '" />');
		this.$song.append('<div class="jukebox-songs-song-title">' + '<a href="' + this.meta.link + '" >' + this.meta.artist + '</a></div>');

		return this.$song;
	}
}

$(document).ready(function() {
	Jukebox.start();
	// when the user presses enter on the text input run the following line

	document.getElementsByClassName('soundcloud-input')[0].addEventListener
	("keypress", function(event) {
		console.log(event.key);

		if (event.key === "Enter")
			return Jukebox.addSong($('.soundcloud-input').val()
		);
		else {
			return ("");
		}
	});
});
