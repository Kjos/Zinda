function randomString(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function byteArrayToInt(data, p) {
    var i = 0;
    i += data[p + 0] << 24;
    i += data[p + 1] << 16;
    i += data[p + 2] << 8;
    i += data[p + 3] << 0;
    return i;
}

function intToByteArray(value, data, p) {
    data[p + 0] = (value >> 24) & 0xff;
    data[p + 1] = (value >> 16) & 0xff;
    data[p + 2] = (value >> 8) & 0xff;
    data[p + 3] = (value >> 0) & 0xff;
}

function getColorCode() {
    var makeColorCode = '0123456789ABCDEF';
    var code = '#';
    for (var count = 0; count < 6; count++) {
        code = code + makeColorCode[Math.floor(Math.random() * 16)];
    }
    return code;
}

var DEBUG = false;
var playerId = Math.floor(Math.random() * Math.pow(2, 32));
var playerColor = getColorCode();
var audioSampleRate = 11025;

var hasFocus = true;
window.onfocus = function() { hasFocus = true; }
window.onblur = function() { hasFocus = false; }

window.onresize = function() {
    var wrapper = document.getElementById('wrapper');
    if (!wrapper) return;
    
    var objs = wrapper.children;
    if (objs.length == 0) return;
    
    for (var k = 0; k < objs.length; k++) {
        objs[k].style.width = "1px";
        objs[k].style.height = "1px";
    }
};

setInterval(function() {
    var wrapper = document.getElementById('wrapper');
    if (!wrapper) return;
    
    var objs = wrapper.children;
    if (objs.length == 0) return;

    var diff = wrapper.clientHeight - document.body.clientHeight;
    var prevDiff = diff;
    
    var origW = objs[0].getAttribute('width');
    var origH = objs[0].getAttribute('height');
    var aspect = origW / origH;
    
    var h;
    for (var k = 0; k < objs.length; k++) {
        var h2 = parseFloat(objs[k].style.height, 10);
        if (!h2) {
            h = 0;
            break;            
        } else {
            h = h2;
        }
    }
    
    var ph = h;
    diff = Math.max(-30, Math.min(30, diff));
    h -= diff;
    
    for (var k = 0; k < objs.length; k++) {
        var origW2 = objs[k].getAttribute('width');
        var origH2 = objs[k].getAttribute('height');
        var aspect2 = origW2 / origH2;
        
        objs[k].style.width = h * aspect2 + "px";
        objs[k].style.height = h + "px";
    }
    
    diff = wrapper.clientHeight - document.body.clientHeight;
    if (Math.abs(diff) >= Math.abs(prevDiff)) {
        objs[0].style.width = ph * aspect + "px";
        objs[0].style.height = ph + "px";
        
        for (var k = 0; k < objs.length; k++) {
            var origW2 = objs[k].getAttribute('width');
            var origH2 = objs[k].getAttribute('height');
            var aspect2 = origW2 / origH2;
            
            objs[k].style.width = ph * aspect2 + "px";
            objs[k].style.height = ph + "px";
        }
    }
    
}, 100);

function showError(value) {
    var err = document.getElementById('error');
    err.innerHTML = value;
}


document.addEventListener('touchmove', function (event) {
  //event.preventDefault();
}, { passive: false });