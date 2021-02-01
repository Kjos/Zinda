
var canvas = new Array();
var ctx = new Array();
var ipCanvas = new Array();
var ipCtx = new Array();
var frameCanvas = new Array();
var fctx = new Array();
var frameCanvas2 = new Array();
var fctx2 = new Array();

function removeCanvas(pid) {
    console.log(canvas[pid]);
    document.getElementById('wrapper').removeChild(canvas[pid]);

    delete ipCanvas[pid];
    delete ipCtx[pid];
    delete canvas[pid];
    delete ctx[pid];
    delete frameCanvas[pid];
    delete fctx[pid];
    delete frameCanvas2[pid];
    delete fctx2[pid];
}

function canvasResize(pid, image, force) {
    var height = image.height * 2;

    var createIpCanvas = !ipCanvas[pid] || ipCanvas[pid][0].height != height;

    if (force || createIpCanvas || canvas[pid].width != image.width || canvas[pid].height != height) {

        if (!canvas[pid]) {
            canvas[pid] = document.createElement('canvas');
            document.getElementById('wrapper').appendChild(canvas[pid]);
        }
        frameCanvas[pid] = document.createElement('canvas');
        frameCanvas2[pid] = document.createElement('canvas');

        canvas[pid].width = image.width;
        canvas[pid].height = height;

        frameCanvas[pid].width = image.width;
        frameCanvas[pid].height = height;
        frameCanvas2[pid].width = image.width;
        frameCanvas2[pid].height = image.height;
        ctx[pid] = canvas[pid].getContext("2d");
        fctx[pid] = frameCanvas[pid].getContext('2d');
        fctx2[pid] = frameCanvas2[pid].getContext('2d');
        ctx[pid].imageSmoothingEnabled = false;
        fctx[pid].imageSmoothingEnabled = false;
        fctx2[pid].imageSmoothingEnabled = false;
    }

    if (createIpCanvas) {
        ipCanvas[pid] = new Array();
        ipCtx[pid] = new Array();

        for (var i = 0; i < 2; i++) {
            ipCanvas[pid][i] = document.createElement('canvas');
            ipCanvas[pid][i].width = 1;
            ipCanvas[pid][i].height = height;
            ipCtx[pid][i] = ipCanvas[pid][i].getContext('2d');
            var imgData = ipCtx[pid][i].getImageData(0, 0, 1, height);
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
            ipCtx[pid][i].putImageData(imgData, 0, 0);
        }
    }
}

function frameCompositing(pid) {
    if (!canvas[pid]) {
        canvasResize(pid, this, true);
    }

    if (!this.bframe) {
        canvasResize(pid, this, false);
        fctx[pid].globalCompositeOperation = "source-over";
        fctx[pid].drawImage(this, 0, 0, canvas[pid].width, canvas[pid].height);

        fctx[pid].globalCompositeOperation = "source-atop";
        fctx[pid].drawImage(ipCanvas[pid][this.ip1], 0, 0, canvas[pid].width, canvas[pid].height);

        ctx[pid].globalCompositeOperation = "source-atop";
        ctx[pid].drawImage(ipCanvas[pid][this.ip2], 0, 0, canvas[pid].width, canvas[pid].height);

        ctx[pid].globalCompositeOperation = "lighter";
        ctx[pid].drawImage(frameCanvas[pid], 0, 0, canvas[pid].width, canvas[pid].height);
    } else if (this.keyframe) {
        // Copy image
        fctx2[pid].globalCompositeOperation = "source-over";
        fctx2[pid].drawImage(this, 0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Take lower half
        fctx2[pid].globalCompositeOperation = "darken";
        fctx2[pid].fillStyle = 'rgb(128,128,128)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Multiply by 2
        fctx2[pid].globalCompositeOperation = "color-dodge";
        fctx2[pid].fillStyle = 'rgb(128,128,128)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Invert
        fctx2[pid].globalCompositeOperation = "difference";
        fctx2[pid].fillStyle = 'rgb(255,255,255)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Subtract with keyframe
        fctx2[pid].globalCompositeOperation = "difference";
        fctx2[pid].drawImage(this.keyframe, 0, 0, canvas[pid].width, frameCanvas2[pid].height);

        fctx[pid].globalCompositeOperation = "source-over";
        fctx[pid].drawImage(frameCanvas2[pid], 0, 0, canvas[pid].width, canvas[pid].height);

        // ------
        // Copy
        fctx2[pid].globalCompositeOperation = "source-over";
        fctx2[pid].drawImage(this, 0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Take upper half
        fctx2[pid].globalCompositeOperation = "lighten";
        fctx2[pid].fillStyle = 'rgb(128,128,128)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Invert
        fctx2[pid].globalCompositeOperation = "difference";
        fctx2[pid].fillStyle = 'rgb(255,255,255)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Multiply
        fctx2[pid].globalCompositeOperation = "color-dodge";
        fctx2[pid].fillStyle = 'rgb(128,128,128)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Invert
        fctx2[pid].globalCompositeOperation = "difference";
        fctx2[pid].fillStyle = 'rgb(255,255,255)';
        fctx2[pid].fillRect(0, 0, canvas[pid].width, frameCanvas2[pid].height);

        // Add to stored fb
        fctx[pid].globalCompositeOperation = "lighter";
        fctx[pid].drawImage(frameCanvas2[pid], 0, 0, canvas[pid].width, canvas[pid].height);

        // Interlace
        fctx[pid].globalCompositeOperation = "source-atop";
        fctx[pid].drawImage(ipCanvas[pid][this.ip1], 0, 0, canvas[pid].width, canvas[pid].height);

        // Interlace 2
        ctx[pid].globalCompositeOperation = "source-atop";
        ctx[pid].drawImage(ipCanvas[pid][this.ip2], 0, 0, canvas[pid].width, canvas[pid].height);

        // Merge both
        ctx[pid].globalCompositeOperation = "lighter";
        ctx[pid].drawImage(frameCanvas[pid], 0, 0, canvas[pid].width, canvas[pid].height);
    }
};
var websocket;
var urlCreator = window.URL || window.webkitURL;


var lastKeyFrame = new Array();
var rbytesSum = 0;
var rframeSum = 0;
var rbframeSum = 0;

function parseVideo(data) {
    var keyframe = data[1] & 0x01;
    var interlace = data[2] & 0x01;
    var pid = byteArrayToInt(data, 3);

    rframeSum++;
    if (keyframe == 0) rbframeSum++;
    rbytesSum += data.length;

    var image = new Image();
    image.ip1 = interlace;
    image.ip2 = 1 - interlace;

    if (!(pid in lastKeyFrame)) {
        lastKeyFrame[pid] = new Array(false, false)
    }

    image.bframe = keyframe == 0;
    if (keyframe == 1) {
        lastKeyFrame[pid][interlace] = image;
    } else {
        image.keyframe = lastKeyFrame[pid][interlace];
    }
    image.frameLoad = frameCompositing;
    image.onload = function () {
        image.frameLoad(pid);
    }
    var blob = new Blob([data.slice(7)], { type: "image/jpeg" });
    image.src = urlCreator.createObjectURL(blob);
    delete blob;
}

setInterval(function () {
    document.getElementById('fps').innerHTML = "FPS:" + rframeSum + " bframes:" + rbframeSum + " mbit/s:" + (rbytesSum * 8 / 1024 / 1024);
    rbytesSum = 0;
    rframeSum = 0;
    rbframeSum = 0;
}, 1000);
