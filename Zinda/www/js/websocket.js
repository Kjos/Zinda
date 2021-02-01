var ws = null;

function connectWebSocket() {
    if ("WebSocket" in window) {
            ws = new WebSocket(WS_URL);
            ws.binaryType = 'arraybuffer';

            ws.onopen = function () {
                showError("");
            };

            ws.onmessage = function (evt) {
                var data = new Uint8Array(evt.data);
                switch (data[0] & 0xff) {
                    // Video
                    case 0:
                        parseVideo(data);
                        break;
                    // Audio
                    case 1:
                        parseAudio(data);
                        break;
                    // Chat
                    case 2:
                        break;
                    // Login
                    case 3:
                        playerId = byteArrayToInt(data, 1);
                        initAudio();
                        initVideo();
                        break;
                    // Logoff
                    case 4:
                        var pid = byteArrayToInt(data, 1);
                        removeCanvas(pid);
                        break;
                    case 5:
                        submitKeyframes();
                        break;
                    case 6:
                        receiveDTMF(data);
                        break;
                }
                delete data;
            };

            ws.onclose = function () {
                showError("Error occurred. <a href=\"https://" + ADDR_PORT + "\" target=\"_blank\">Would you like to add the certificate?</a> You can remove certificates in your browser settings.");
            };

            ws.onerror = function (e) {
                showError("Error occurred: " + e);
            };
    } else {
        showError("Error occurred. WebSocket not supported by your browser.");
    }
}

function submit(data) {
    if (ws && ws.readyState != 1) return;

    ws.send(data);
}

window.addEventListener('load', connectWebSocket);