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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    setTimeout(init, 500)
};