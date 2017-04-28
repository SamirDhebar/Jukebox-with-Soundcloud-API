/* globals $, SC */

var SoundCloud = {
	dom: {},
	activeSong: null,
	activeAudio: null,

	init: function() {
		SC.initialize({ client_id: "fd4e76fc67798bfa742089ed619084a6" });

		this.dom = {
			input: $(".soundcloud-input"),
			songArt: $(".soundcloud-song-image"),
			songTitle: $(".soundcloud-song-info-title"),
			songArtist: $(".soundcloud-song-info-artist"),
			songDuration: $(".soundcloud-song-info-duration"),
			play: $(".soundcloud-song-play"),
		};

		this.listen();
	},

	listen: function() {
		this.dom.input.on("keyup", function() {
			this.load(this.dom.input.val());
		}.bind(this));

		this.dom.play.on("click", function() {
			this.activeAudio.play();
		}.bind(this));
	},

	load: function(url) {
		// SoundCloud api method that converts a soundcloud url
		// in to an object of data. Documentation can be found:
		// https://developers.soundcloud.com/docs/api/sdks#resolve
		SC.resolve(url)
			// Now that we have the song object, we'll assign it to
			// `activeSong` to reference in render, re-render the
			// application, and pass that song data to the next function
			.then(function(song) {
				this.activeSong = song;
				this.render();
				return song;
			}.bind(this))
			// Finally, we load the song audio object so that it can be played
			.then(function(song) {
				// Need to append this to the URI so that soundcloud gives us access
				// to stream the song
				this.activeAudio = new Audio(song.uri + "/stream?client_id=fd4e76fc67798bfa742089ed619084a6");
				this.render();
			}.bind(this))
			// If anything goes wrong, hit this catch block, and handle any
			// erros by informing the user what went wrong
			.catch(function(err) {
				if (err.status === 404) {
					alert("Couldn't find that song!");
				}
				else {
					alert("Unable to load song, check console for more info");
					console.error(err);
				}
			});
	},

	render: function() {
		if (this.activeSong) {
			this.dom.songArt.attr("src", this.activeSong.artwork_url);
			this.dom.songTitle.html(this.activeSong.title);
			this.dom.songArtist.html(this.activeSong.user.username);

			if (this.activeAudio) {
				this.dom.songDuration.html(this.activeAudio.duration);
				this.dom.play.addClass("canPlay");
			}
			else {
				this.dom.songDuration.html("");
				this.dom.play.removeClass("canPlay");
			}
		}
		else {
			this.dom.songArt.attr("src", "");
			this.dom.songTitle.html("");
			this.dom.songArtist.html("");
			this.dom.songDuration.html("");
			this.dom.play.removeClass("canPlay");
		}
	},
};

$(document).ready(function() {
	SoundCloud.init();
});
