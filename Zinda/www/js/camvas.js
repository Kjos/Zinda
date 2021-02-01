/*
Copyright (c) 2012 Claudio Brandolino

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


// requestAnimationFrame implementation, we just ignore it.
// My policy for experimental software is: if you don't have a
// nightly build, you don't deserve exceptions.
window.URL = window.URL || window.webkitURL

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia

window.requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame

// Integrate navigator.getUserMedia & navigator.mediaDevices.getUserMedia
function getUserMedia(constraints, successCallback, errorCallback) {
    if (!constraints || !successCallback || !errorCallback) { return }

    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia(constraints).then(successCallback, errorCallback)
    } else {
        navigator.getUserMedia(constraints, successCallback, errorCallback)
    }
}
// The function takes a canvas context and a `drawFunc` function.
// `drawFunc` receives two parameters, the video and the time since
// the last time it was called.
function camvas(initFunc, drawFunc, soundFunc) {
    var self = this
    this.draw = drawFunc

    // We can't `new Video()` yet, so we'll resort to the vintage
    // "hidden div" hack for dynamic loading.
    this.wrapper = document.getElementById('wrapper');
    this.wrapper.innerHTML = "<video id=\"video\" width=1 height=1 muted=\"true\" autoplay=\"true\"></video>";
    this.video = document.getElementById('video')

    this.video.setAttribute('width', WIDTH)
    this.video.setAttribute('height', HEIGHT)
    
    // The callback happens when we are starting to stream the video.
    getUserMedia({ video: true, audio: true }, function (stream) {
        // Yay, now our webcam input is treated as a normal video and
        // we can start having fun
        try {
            self.video.srcObject = stream;
        } catch (error) {
            self.video.src = URL.createObjectURL(stream);
        }

        try {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Create a source from our MediaStream
            var source = audioContext.createMediaStreamSource(stream);

            // Now create a Javascript processing node with the following parameters:
            // 4096 = bufferSize (See notes below)
            // 2 = numberOfInputChannels (i.e. Stereo input)
            // 2 = numberOfOutputChannels (i.e. Stereo output)
            var node = audioContext.createScriptProcessor(2048, 1, 0);
            node.onaudioprocess = function (e) {
                soundFunc(audioContext.sampleRate, e.inputBuffer.getChannelData(0));
            }
            // Connect the microphone to the script processor
            source.connect(node);
            node.connect(audioContext.destination);
        } catch (error) {
        }

        // Let's start drawing the canvas!
        self.update()
    }, function (err) {
        throw err
    })

    // As soon as we can draw a new frame on the canvas, we call the `draw` function 
    // we passed as a parameter.
    this.update = function () {
        var self = this
        var last = Date.now()
        var loop = function () {
            // For some effects, you might want to know how much time is passed
            // since the last frame; that's why we pass along a Delta time `dt`
            // variable (expressed in milliseconds)
            var dt = Date.now() - last
            last = Date.now()
            self.draw(self.video, dt)
            requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
    }

    initFunc();
}

