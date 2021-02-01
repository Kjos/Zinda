var sentAudioData = 0;
setInterval(function() {
	console.log("audio data mbit/s sent: " + sentAudioData / 1024 / 1024 * 8);
	sentAudioData = 0;
}, 1000);

var f = true;
function soundFunc(sampleRate, data) {
    if (!data) return;
    
    if (f) {
        f = false;
        console.log("Samplerate is: " + sampleRate);
    }
    var audioBuffer = new Array();
    audioBuffer.push(1);
    
    var skip = sampleRate / audioSampleRate;
    var i = 1;
    for (var p = 0.0; p < data.length; i++, p += skip) {
        audioBuffer.push(Math.max(-127, Math.min(127, data[parseInt(p)] * 127.0)));
    }
    sentAudioData += i;
    
    submit(new Int8Array(audioBuffer));
}


