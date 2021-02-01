var player;

var receivedAudioData = 0;
setInterval(function () {
    console.log("audio data mbit/s received: " + receivedAudioData / 1024 / 1024 * 8);
    receivedAudioData = 0;
}, 1000);

function initAudio() {
	if (player) player.destroy();
	player = new PCMPlayer({
	    encoding: '8bitInt',
	    channels: 1,
        sampleRate: audioSampleRate
	});
}

function parseAudio(data) {
    var bytes = Int8Array.from(data);
    receivedAudioData += bytes.length;
    player.feedFormatted(bytes.slice(1));
	delete bytes;
}
