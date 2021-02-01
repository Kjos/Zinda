var buffer;
var audioFramestamp = 0;

var sentAudioData = 0;
setInterval(function() {
	console.log("audio data mbit/s: " + sentAudioData / 1024 / 1024 * 8);
	sentAudioData = 0;
}, 1000);

var start = true;
function soundFunc(sampleRate, data) {
	if (!data) return;
	
	if (start) {
		buffer = new Int8Array(Math.ceil(4096 * 4 * 11025 / sampleRate));
		console.log(data);
		console.log(sampleRate);
		start = false;
	}
	var skip = Math.floor(sampleRate / 11025);
	for (var i = 0, p = 0; p < data.length; i++, p += skip) {
		buffer[i] = data[p] * 127.0;
	}
	sentAudioData += buffer.byteLength;
	
	audioFramestamp++;
	var url = "upload-audio.php?sid=" + SESSION_ID + "&framestamp=" + audioFramestamp;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(e) {
		if (4 == this.readyState) {
		}
	};
	xhr.open('POST', url, true);
	xhr.send(buffer);
}


