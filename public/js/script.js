async function init() {
    startStreaming();
}

const startStreaming = async function() {
    await fetch('/streamon', { method: 'POST' })

    const tellocamera = document.getElementById('tellocamera');
    const winLoc = window.location;
    const webSockUrl = `ws://${winLoc.hostname}:${winLoc.port}/`;

    const telloPlayer = new JSMpeg.Player(webSockUrl, {
        canvas: tellocamera,
        audio: false,
        videoBufferSize: 512 * 1024,
        preserveDrawingBuffer: true
    });
};

const connectToDrone = async function() {
    await fetch('/connect', { method: 'POST' });
};

const takeOff = async function() {
    await fetch('/takeoff', { method: 'POST' });
}

const land = async function() {
    await fetch('/land', { method: 'POST' });
}

const up = async function() {
    await fetch('/up', { method: 'POST' });
}

const down = async function() {
    await fetch('/down', { method: 'POST' });
}

const battery = async function() {
    await fetch('/battery', { method: 'POST' });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    setTimeout(init, 500)
};