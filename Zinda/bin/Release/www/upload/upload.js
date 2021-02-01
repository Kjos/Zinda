
var framestamp = 0;

var rgb = new Array();
var lastDifference = new Array(0.0,0.0);
var sumDifference = 0.0;
var lastInterFrameSize = new Array(0,0);
var lastKeyFrameSize = new Array(0,0);

var bytesSum = 0;
var frameSum = 0;
var bframeSum = 0;
var cameraSum = 0;

var DEBUG = true;

var changed = false;

var requestKeyframes = 2;

var FPS_MS = 1000 / FPS;

var canvas;
var ctx;
var vctx;
var vdata;
var imageData;
var encoder;

var urlCreator = window.URL || window.webkitURL;
var xhr = new Array(new XMLHttpRequest(),new XMLHttpRequest());

var last = Date.now();
function init() {
	encoder = new pttJPEG();
	canvas = document.getElementsByTagName("canvas")[0];
	ctx = canvas.getContext('2d')
	var dtt = 0;
	var draw = function(video, dt) {
		dtt += dt;
		if (dtt < FPS_MS) return;
		dtt -= FPS_MS;
		
		var interlace = framestamp % 2;
		if (xhr[interlace].readyState != 4 && xhr[interlace].readyState != 0) {
			return;
		}
		
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		cameraSum++;

		if (requestKeyframes > 0) {
			interlaceKeyFrame();
			requestKeyframes--;
		} else {
			interlaceFrame();
		}
		framestamp++;
	}
	var myCamvas = new camvas(ctx, initCam, draw, soundFunc);
}

function initCam() {
	var body = document.getElementsByTagName("body")[0];
	
	vcanvas = document.createElement('canvas');
	vcanvas.width = canvas.width;
	vcanvas.height = canvas.height / 2;
	body.appendChild(vcanvas);
	vctx = vcanvas.getContext('2d');
	
	for (var i = 0; i < 3; i++) {
		var id = new ImageData(vcanvas.width, vcanvas.height)
		var p = 3;
		for (var y = 0; y < id.height; y++) {
			for (var x = 0; x < id.width; x++, p += 4) {
				id.data[p] = 255;
			}
		}
		rgb.push(id);
	}

	var bytesSum10 = 0;
	setInterval(function() {
		document.getElementById('fps').innerHTML = "CamFPS:" + cameraSum + " FPS:" + frameSum + " bframes:" + bframeSum + " mbit/s:" + (bytesSum * 8 / 1024 / 1024);
		bytesSum10 += bytesSum;
		bytesSum = 0;
		frameSum = 0;
		bframeSum = 0;
		cameraSum = 0;
	}, 1000);

	setInterval(function() {
		document.getElementById('fps10').innerHTML = "mbit/s:" + (bytesSum10 * 8 / 10 / 1024 / 1024);
		bytesSum10 = 0;
	}, 10000);
}

window.addEventListener('load', init);

var tog = 1;
document.addEventListener('keyup', (e) => {
	tog = 1-tog;
	console.log(tog);
});

function compressAndSend(keyframe, fs, iData, callback) {
	if (DEBUG) vctx.putImageData(iData, 0, 0);
	
    var inImg = new encoder.pttImage(iData);
    var bw = new encoder.ByteWriter();
    encoder.encode(keyframe ? JPEG_QUALITY_KEYFRAME : JPEG_QUALITY, inImg, bw);
	var bytes = bw.getData();
	
	var url = "upload.php?sid=" + SESSION_ID + "&keyframe=" + keyframe + "&framestamp=" + fs;

	var interlace = fs % 2;
	
	xhr[interlace].onreadystatechange = function(e) {
		if (4 == this.readyState) {
			callback(bw.getWrittenBytes());
		}
	};
	xhr[interlace].open('POST', url, true);
	xhr[interlace].send(bytes);
	
	return bw.getWrittenBytes();
}

function interlaceKeyFrame() {
	var interlace = framestamp % 2;

	var width = imageData.width;
	var height = imageData.height;
	var data = imageData.data;


	var cdata = null;

	var d = rgb[interlace].data;

	var skip = width * 4;
	var p = interlace == 1 ? skip : 0;
	var p2 = 0;
	for (; p2 < d.length; p2++, p++) {
		if (p2 % skip == skip-1) p += skip;
		d[p2] = data[p];
	}

	lastDifference[interlace] = 0;
	sumDifference = 0.0;
	lastInterFrameSize[interlace] = 0;

	var len = compressAndSend(1, framestamp, rgb[interlace], function() {
		bytesSum += len;
		frameSum++;
	});
	lastKeyFrameSize[interlace] = len;
}

function interlaceFrame() {
	var interlace = framestamp % 2;

	var width = imageData.width;
	var height = imageData.height;
	var data = imageData.data;

	var difference = 0;

	var skip = width * 4;
	var p = interlace == 1 ? skip : 0;
	var p2 = 0;
	var d = rgb[2].data;
	var kd = rgb[interlace].data;
	for (; p2 < d.length; p2++, p++) {
		if (p2 % skip == skip-1) p += skip;
		if (p2 % 4 == 3) continue;

		var cc = (data[p] & 0xff) - (kd[p2] & 0xff);
		difference += Math.abs(cc);
		cc /= 2;
		cc = 127 + cc;

		d[p2] = cc;
	}

	difference /= width * height * 255.0;
	difference /= FPS;

	sumDifference += difference
	if (sumDifference > KEYFRAME_THRESHOLD_SUM) {
		requestKeyframes = 2;
	}

	if (difference < IGNORE_DIFFERENCE / FPS) {
		lastInterFrameSize[interlace] = 0;
		return;
	}
	
	var len = compressAndSend(0, framestamp, rgb[2], function() {
		bytesSum += len;
		frameSum++;
		bframeSum++;

		lastDifference[interlace] = difference;
	});

	// Frame is not going back to keyframe
	if (len > lastKeyFrameSize[interlace] * BFRAME_THRESHOLD) {
		requestKeyframes = 2;
	}
}