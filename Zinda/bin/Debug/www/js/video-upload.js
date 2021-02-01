
var rgb = new Array();
var canvasBuffer = new Array();
var contextBuffer = new Array();
var bufferCnt = 0;

var lastDifference = new Array(0.0, 0.0);
var sumDifference = 0.0;
var lastInterFrameSize = new Array(0, 0);
var lastKeyFrameSize = new Array(0, 0);

var bytesSum = 0;
var frameSum = 0;
var bframeSum = 0;
var cameraSum = 0;

var DEBUG = true;

var changed = false;

var requestKeyframes = 2;

var FPS_MS = 1000 / FPS;

var ucanvas;
var vctx;
var vdata;
var imageData;
var encoder;

var last = Date.now();
function initVideo() {
    encoder = new pttJPEG();
    
    for (var i = 0; i < 5; i++) {
        var c = document.createElement("canvas");
        var uc = c.getContext('2d');
        c.setAttribute('width', WIDTH);
        c.setAttribute('height', HEIGHT);
        c.style.position = "fixed";
        c.style.left = "0px";
        c.style.top = "0px";
        c.style.display = "none";
        canvasBuffer.push(c);
        contextBuffer.push(uc);
    }

    var dtt = 0;
    var interlace = 1;
    var draw = function (video, dt) {
        dtt += dt;
        if (dtt < FPS_MS) return;
        dtt -= FPS_MS;
        
        interlace = 1 - interlace;
        
        var ib = (bufferCnt + canvasBuffer.length - 1) % canvasBuffer.length;
        bufferCnt++;
        if (bufferCnt >= canvasBuffer.length) bufferCnt = 0;
        
        var uctx = contextBuffer[ib];
        uctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
        var borderSize = Math.max(2, WIDTH / 80);
        uctx.fillStyle = playerColor;
        uctx.fillRect(0, 0, WIDTH, borderSize);
        uctx.fillRect(0, 0, borderSize, HEIGHT);
        uctx.fillRect(0, HEIGHT - borderSize, WIDTH, borderSize);
        uctx.fillRect(WIDTH - borderSize, 0, borderSize, HEIGHT);
        
        imageData = contextBuffer[bufferCnt].getImageData(0, 0, WIDTH, HEIGHT);
        cameraSum++;

        if (requestKeyframes > 0) {
            interlaceKeyFrame(interlace);
            requestKeyframes--;
        } else {
            interlaceFrame(interlace);
        }
    }
    var myCamvas = new camvas(initCam, draw, soundFunc);
}

function initCam() {
    var body = document.getElementsByTagName("body")[0];

    vcanvas = document.createElement('canvas');
    vcanvas.width = WIDTH;
    vcanvas.height = HEIGHT / 2;
    vcanvas.style.position = "fixed";
    vcanvas.style.left = "0px";
    vcanvas.style.top = "0px";
    vcanvas.style.display = "none";
    console.log("WIDTH:" + WIDTH + " HEIGHT: " + HEIGHT);
    body.appendChild(vcanvas);
    vctx = vcanvas.getContext('2d');

    for (var i = 0; i < 3; i++) {
        var id = new ImageData(vcanvas.width, vcanvas.height)
        var p = 3;
        for (var y = 0; y < id.height; y++) {
            for (var x = 0; x < id.width; x++ , p += 4) {
                id.data[p] = 255;
            }
        }
        rgb.push(id);
    }

    var bytesSum10 = 0;
    setInterval(function () {
        console.log("CamFPS:" + cameraSum + " FPS:" + frameSum + " bframes:" + bframeSum + " mbit/s:" + (bytesSum * 8 / 1024 / 1024));
        bytesSum10 += bytesSum;
        bytesSum = 0;
        frameSum = 0;
        bframeSum = 0;
        cameraSum = 0;
    }, 1000);

    setInterval(function () {
        console.log("mbit/s:" + (bytesSum10 * 8 / 10 / 1024 / 1024));
        bytesSum10 = 0;
    }, 10000);
}

function compressAndSend(keyframe, interlace, iData, callback) {
    if (DEBUG) vctx.putImageData(iData, 0, 0);
    
    var inImg = new encoder.pttImage(iData);
    var bw = new encoder.ByteWriter();
    encoder.encode(JPEG_QUALITY, inImg, bw);
    var bytes = bw.getData();
    var data = new Uint8Array(bytes.length + 7);
    // Video type
    data[0] = 0x00;
    data[1] = keyframe & 0x01;
    data[2] = interlace & 0x01;
    intToByteArray(playerId, data, 3);

    for (var i = 0, p = 7; i < bytes.length; i++, p++) {
        data[p] = bytes[i];
    }

    bytesSum += data.length;
    frameSum++;
    if (!keyframe) bframeSum++;
    
    submit(data);

    var size = data.length;
    delete data;
    return size;
}

function interlaceKeyFrame(interlace) {
    var width = imageData.width;
    var height = imageData.height;
    var data = imageData.data;

    var d = rgb[interlace].data;

    var skip = width * 4;
    var p = interlace == 1 ? 0 : -skip;
    var p2 = 0;
    for (; p2 < d.length; p2++ , p++) {
        if (p2 % skip == 0) p += skip;
        d[p2] = data[p];
    }

    lastDifference[interlace] = 0;
    sumDifference = 0.0;
    lastInterFrameSize[interlace] = 0;

    var len = compressAndSend(1, interlace, rgb[interlace], function () {
        bytesSum += len;
        frameSum++;
    });
    lastKeyFrameSize[interlace] = len;
}

function interlaceFrame(interlace) {
    var width = imageData.width;
    var height = imageData.height;
    var data = imageData.data;

    var difference = 0;

    var skip = width * 4;
    var p = interlace == 1 ? 0 : -skip;
    var p2 = 0;
    var d = rgb[2].data;
    var kd = rgb[interlace].data;
    for (; p2 < d.length; p2++ , p++) {
        if (p2 % skip == 0) p += skip;
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
        return;
    }

    lastDifference[interlace] = difference;

    var len = compressAndSend(0, interlace, rgb[2], function () {
        bytesSum += len;
        frameSum++;
        bframeSum++;
    });

    // Frame is not going back to keyframe
    if (len > lastKeyFrameSize[interlace] * BFRAME_THRESHOLD) {
        requestKeyframes = 2;
    }

    lastInterFrameSize[interlace] = len;
}

function submitKeyframes() {
    requestKeyframes = 2;
}