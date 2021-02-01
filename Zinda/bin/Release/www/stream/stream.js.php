
function sendCommand(command, value) {
	var send = {};
	send[command] = value;
	if (websocket && websocket.readyState !== websocket.CLOSED && 
		websocket.readyState !== websocket.CONNECTING) {
		websocket.send(JSON.stringify(send));
	}
}

function getCursor(e) {
	var pos = [0,0];
	if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		pos[0] = touch.pageX;
		pos[1] = touch.pageY;
	} else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
		pos[0] = e.pageX;
		pos[1] = e.pageY;
	}
	pos[0] -= (window.innerWidth - canvas.width) / 2;
	pos[1] -= (window.innerHeight - canvas.height) / 2;
	pos[0] *= 10000;
	pos[1] *= 10000;
	pos[0] /= canvas.width;
	pos[1] /= canvas.height;

	if (pos[0] < 0 || pos[1] < 0 || pos[0] > 10000 || pos[1] > 10000) {
		return false;
	} else {
		return pos;
	}
}

var lastmovetime = Date.now();
function inputSetup() {
	var keysDown = new Array();
	$(window).on({ 'keydown' : function( e ) {
			if (!keysDown[e.keyCode]) {
				keysDown[e.keyCode] = true;
				sendCommand("keyDown", e.keyCode);
				console.log("keyDown: " + e.keyCode);
			}
		}
	});
	$(window).on({ 'keyup' : function( e ) {
			sendCommand("keyUp", e.keyCode);
			keysDown[e.keyCode] = false;
		}
	});
	$("#canvas").on({ 'mousemove touchmove' : function( e ) {
			e.preventDefault();

			var t = Date.now();
			if (t - lastmovetime < 30) return;

			var pos = getCursor(e);
			if (!pos) return;

			lastmovetime = t;
			sendCommand("mouseMove", pos);
		}
	});
	$("#canvas").on({ 'mousedown touchstart' : function( e ) {
			e.preventDefault();

			var pos = getCursor(e);
			if (!pos) return;

			$("#keyboardHack").blur();
			console.log("touch start");
			sendCommand("mousePress", pos);
		}
	});
	$("#canvas").on({ 'mouseup touchend touchcancel' : function( e ) {
			e.preventDefault();
			
			var pos = getCursor(e);
			if (!pos) return;

			console.log("touch end");
			sendCommand("mouseRelease", pos);
		}
	});

	setInterval(keyboardCheck, 100);
}

function keyboardCheck() {
// OculusGo doesn't handle input listeners correctly.
// Need to check every once in a while
	var str = $("#keyboardHack").val();
	if (str.length > 1) {
		sendCommand("keys", str.substring(1));
		$("#keyboardHack").val(' ');
	} else if (str.length == 0) {
		sendCommand("backspace", true);
		$("#keyboardHack").val(' ');
	}
}

var ipCanvas;
var ipCtx;
function canvasResize(image, force) {
	var height = image.height * 2;

	var createIpCanvas = !ipCanvas || ipCanvas[0].height != height;

	if (force || createIpCanvas || canvas.width != image.width || canvas.height != height) {

		canvas.width = image.width;
		canvas.height = height;
        canvas.style.position = "absolute";
		canvas.style.left = ((window.innerWidth - image.width) / 2) + "px";
		canvas.style.top = ((window.innerHeight - height) / 2) + "px";
		canvas.style.left = (window.innerWidth  / 4) + "px";
		canvas.style.top = (window.innerHeight / 4) + "px";
		
		frameCanvas.width = image.width;
		frameCanvas.height = height;
		frameCanvas2.width = image.width;
		frameCanvas2.height = image.height;
		ctx = canvas.getContext("2d");
		fctx = frameCanvas.getContext('2d');
		fctx2 = frameCanvas2.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		fctx.imageSmoothingEnabled = false;
		fctx2.imageSmoothingEnabled = false;
	}

	if (createIpCanvas) {
		ipCanvas = new Array();
		ipCtx = new Array();

		for (var i = 0; i < 2; i++) {
			ipCanvas[i] = document.createElement('canvas');
			ipCanvas[i].width = 1;
			ipCanvas[i].height = height;
			ipCtx[i] = ipCanvas[i].getContext('2d');
			var imgData = ipCtx[i].getImageData(0, 0, 1, height);
			var bytes = imgData.data;
			var val1 = i == 0 ? 255 : 0;
			var val2 = i == 1 ? 255 : 0;
			for (var k = 0; k < bytes.length;) {
				bytes[k] = val1;
				k++;
				bytes[k] = val1;
				k++;
				bytes[k] = val1;
				k++;
				bytes[k] = val2;
				k++;
				
				if (k >= bytes.length) break;

				bytes[k] = val2;
				k++;
				bytes[k] = val2;
				k++;
				bytes[k] = val2;
				k++;
				bytes[k] = val1;
				k++;
			}
			ipCtx[i].putImageData(imgData,0,0);
		}
	}
}

function frameCompositing() {
	if (!this.bframe) {
		canvasResize(this, false);
		fctx.globalCompositeOperation = "source-over";
		fctx.drawImage(this, 0, 0, canvas.width, canvas.height);

		fctx.globalCompositeOperation = "source-atop";
		fctx.drawImage(ipCanvas[this.ip1], 0, 0, canvas.width, canvas.height);

		ctx.globalCompositeOperation = "source-atop";
		ctx.drawImage(ipCanvas[this.ip2], 0, 0, canvas.width, canvas.height);

		ctx.globalCompositeOperation = "lighter";
		ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
	} else if (this.keyFrame) {
// Copy image
		fctx2.globalCompositeOperation = "source-over";
		fctx2.drawImage(this, 0, 0, canvas.width, frameCanvas2.height);

// Take lower half
		fctx2.globalCompositeOperation = "darken";
		fctx2.fillStyle = 'rgb(128,128,128)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Multiply by 2
		fctx2.globalCompositeOperation = "color-dodge";
		fctx2.fillStyle = 'rgb(128,128,128)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Invert
		fctx2.globalCompositeOperation = "difference";
		fctx2.fillStyle = 'rgb(255,255,255)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Subtract with keyframe
		fctx2.globalCompositeOperation = "difference"; 
		fctx2.drawImage(this.keyFrame, 0, 0, canvas.width, frameCanvas2.height);

		fctx.globalCompositeOperation = "source-over";
		fctx.drawImage(frameCanvas2, 0, 0, canvas.width, canvas.height);

		// ------
// Copy
		fctx2.globalCompositeOperation = "source-over";
		fctx2.drawImage(this, 0, 0, canvas.width, frameCanvas2.height);

// Take upper half
		fctx2.globalCompositeOperation = "lighten";
		fctx2.fillStyle = 'rgb(128,128,128)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Invert
		fctx2.globalCompositeOperation = "difference";
		fctx2.fillStyle = 'rgb(255,255,255)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Multiply
		fctx2.globalCompositeOperation = "color-dodge";
		fctx2.fillStyle = 'rgb(128,128,128)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Invert
		fctx2.globalCompositeOperation = "difference";
		fctx2.fillStyle = 'rgb(255,255,255)';
		fctx2.fillRect(0,0,canvas.width, frameCanvas2.height);

// Add to stored fb
		fctx.globalCompositeOperation = "lighter";
		fctx.drawImage(frameCanvas2, 0, 0, canvas.width, canvas.height);

// Interlace
		fctx.globalCompositeOperation = "source-atop";
		fctx.drawImage(ipCanvas[this.ip1], 0, 0, canvas.width, canvas.height);

// Interlace 2
		ctx.globalCompositeOperation = "source-atop";
		ctx.drawImage(ipCanvas[this.ip2], 0, 0, canvas.width, canvas.height);

// Merge both
		ctx.globalCompositeOperation = "lighter"; 
		ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
	}
};

var canvas;
var ctx;
var frameCanvas;
var fctx;
var frameCanvas2;
var fctx2;
var rCanvas;
var rctx;
var websocket;
var lastKeyFrame = new Array(false, false);
var urlCreator = window.URL || window.webkitURL;

var frameTime = Date.now();
var frameCnt = 0;

var framestamp = 0;
var itype = 0;

var bytesSum = 0;
var frameSum = 0;
var bframeSum = 0;

function receiveLoop() {
	var url = "stream.php?framestamp=" + framestamp;
	
	var xhr = new XMLHttpRequest();
	xhr.responseType = 'arraybuffer';
	xhr.onload = function(e) {
		if (200 == this.status) {
			parseData(xhr, e);
			receiveLoop();
		} else {
			receiveLoop();	
		}
	};
    xhr.onerror = function (e) {
		console.log('error', xhr, xhr.status, xhr.responseText);
		setTimeout(receiveLoop, 1000);	
    };
	xhr.open('GET', url, true);
	xhr.send();
	
}

var start = true;
function parseData(xhr, e) {
	var bytes = new Uint8Array(xhr.response);
	
	var keyframe = parseInt(xhr.getResponseHeader("keyframe"));
	framestamp = parseInt(xhr.getResponseHeader("framestamp"));
	var interlace = framestamp % 2;
	
	frameSum++;
	if (keyframe == 0) bframeSum++;
	bytesSum += bytes.length;

	var image = new Image();
	image.ip1 = interlace;
	image.ip2 = 1 - interlace;

	image.bframe = keyframe == 0;
	if (keyframe == 1) {
		lastKeyFrame[interlace] = image;
	} else {
		image.keyFrame = lastKeyFrame[interlace];
	}
	image.frameLoad = frameCompositing;
	image.onload = function() {
		image.frameLoad(); 
	}
	var blob = new Blob( [ bytes ], { type: "image/jpeg" } );
	image.src = urlCreator.createObjectURL( blob );
	delete blob;
	delete bytes;
}

function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
      (!document.mozFullScreen && !document.webkitIsFullScreen)) {               // current working methods
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
}

var isActive = false;
var pollTimeout = null;
function pollResize(force) {
	if (pollTimeout) clearTimeout(pollTimeout);
	if (force) {	
		sendCommand("window", [window.innerWidth, window.innerHeight]);
	} else {
		pollTimeout = setTimeout(function() {
			sendCommand("window", [window.innerWidth, window.innerHeight]);
		}, 500);
	}
}

function menuInit() {
	$(".menu-nextscreen").click(function() {
		sendCommand("screenSwitch", true);
	});
	$(".menu-fullscreen").click(toggleFullScreen);
	$(".menu-open").click(function() {
		if ($(".menu-contents").css("visibility") == "hidden") {
			$(".menu-contents").css("visibility", "visible");
		} else {
			$(".menu-contents").css("visibility", "hidden");
		}
	});
}

$(document).ready(function(){
	setInterval(function() {
		document.getElementById('fps').innerHTML = "FPS:" + frameSum + " bframes:" + bframeSum + " mbit/s:" + (bytesSum * 8 / 1024 / 1024);
		bytesSum = 0;
		frameSum = 0;
		bframeSum = 0;
	}, 1000);
	
	canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.font = "30px Arial";
	ctx.fillStyle = 'rgb(255,255,255)';
	ctx.fillText("OculusGoStreamer - Kaj Toet", 10, 50);

	frameCanvas = document.createElement('canvas');
	frameCanvas2 = document.createElement('canvas');

	//inputSetup();
	//connectWebSocket();
	//initAudio();
	//menuInit();

	receiveLoop();
	
	window.onresize = pollResize;
});
