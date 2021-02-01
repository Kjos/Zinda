var player;
var audiocontext;
function initAudio() {
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();
	}
	catch(e) {
		console.log('Web Audio API is not supported in this browser');
	}
	
	if (player) player.destroy();
	player = new PCMPlayer({
	    encoding: '8bitInt',
	    channels: 1,
	    sampleRate: 11025
	});
	
	receiveAudioLoop();
}

var buffer = new Array();

var audioFramestamp = 0;
function receiveAudioLoop() {
	var url = "stream-audio.php?sid=" + SESSION_ID + "&framestamp=" + audioFramestamp;
	
	var sxhr = new XMLHttpRequest();
	sxhr.responseType = 'arraybuffer';
	sxhr.onload = function(e) {
		if (200 == this.status) {
			audioFramestamp = parseInt(sxhr.getResponseHeader("framestamp"));
			
			var bytes = new Int8Array(sxhr.response);
			player.feedFormatted(bytes);
			delete bytes;
			
			receiveAudioLoop();
		} else {
			receiveAudioLoop();
		}
	};
    sxhr.onerror = function (e) {
		console.log('error', sxhr, sxhr.status, sxhr.responseText);
		setTimeout(receiveAudioLoop, 1000);	
    };
	sxhr.open('GET', url, true);
	sxhr.send();
}



initAudio();
