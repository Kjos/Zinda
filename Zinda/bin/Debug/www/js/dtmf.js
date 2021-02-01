// polyfill
var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

var context = new AudioContext();

function Tone(context, freq1, freq2) {
    this.context = context;
    this.status = 0;
    this.freq1 = freq1;
    this.freq2 = freq2;
}

Tone.prototype.setup = function(){
    this.key = "";
    this.osc1 = this.context.createOscillator();
    this.osc2 = this.context.createOscillator();
    this.osc1.frequency.value = this.freq1;
    this.osc2.frequency.value = this.freq2;

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0.25;

    this.filter = this.context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency = 8000;

    this.osc1.connect(this.gainNode);
    this.osc2.connect(this.gainNode);

    this.gainNode.connect(this.filter);
    this.filter.connect(this.context.destination);
}

Tone.prototype.start = function(){
    this.setup();
    this.osc1.start(0);
    this.osc2.start(0);
    this.status = 1;
}

Tone.prototype.stop = function(){
    this.osc1.stop(0);
    this.osc2.stop(0);
    this.status = 0;
}

var dtmfFrequencies = {
    "1": {f1: 697, f2: 1209},
    "2": {f1: 697, f2: 1336},
    "3": {f1: 697, f2: 1477},
    "4": {f1: 770, f2: 1209},
    "5": {f1: 770, f2: 1336},
    "6": {f1: 770, f2: 1477},
    "7": {f1: 852, f2: 1209},
    "8": {f1: 852, f2: 1336},
    "9": {f1: 852, f2: 1477},
    "*": {f1: 941, f2: 1209},
    "0": {f1: 941, f2: 1336},
    "#": {f1: 941, f2: 1477}
}

// Create a new Tone instace. (We've initialised it with 
// frequencies of 350 and 440 but it doesn't really matter
// what we choose because we will be changing them in the 
// function below)
var dtmf = new Tone(context, 50, 440);

window.addEventListener('keydown', function(e){
    var key = Number(e.key)
    if (isNaN(key) || e.key === null || e.key === ' ' || e.isRepeating) {
        return;
    }
    
    e.preventDefault();
    
    var send = new Uint8Array(3);
    send[0] = 6;
    send[1] = 1;
    send[2] = key;
    submit(send);
});

// we detect the mouseup event on the window tag as opposed to the li
// tag because otherwise if we release the mouse when not over a button,
// the tone will remain playing
window.addEventListener('keyup', function(e){
    var key = Number(e.key)
    if (isNaN(key) || e.key === null || e.key === ' ') {
        return;
    }
    
    e.preventDefault();
    
    var send = new Uint8Array(3);
    send[0] = 6;
    send[1] = 0;
    send[2] = key;
    submit(send);
});

function receiveDTMF(data) {
    var down = data[1];
    var key = data[2] & 0x01;
    if (down) {
        if (typeof dtmf !== "undefined" && dtmf.status){
            dtmf.stop();
        }
        
        var keyPressed = "" + key; // this gets the number/character that was pressed
        var frequencyPair = dtmfFrequencies[keyPressed]; // this looks up which frequency pair we need

        // this sets the freq1 and freq2 properties
        dtmf.freq1 = frequencyPair.f1;
        dtmf.freq2 = frequencyPair.f2;
        dtmf.key = "" + key;
        if (dtmf.status == 0){
            dtmf.start();
        }
    } else {
        if (typeof dtmf !== "undefined" && dtmf.status){
            dtmf.stop();
        }
    }
}
