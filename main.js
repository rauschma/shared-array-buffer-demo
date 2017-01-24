const worker = new Worker('worker.js');
worker.addEventListener('message', function (event) {
    document.getElementById('output').textContent = event.data;
});

const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);
Lock.initialize(sharedArray, 0);
const lock = new Lock(sharedArray, 0);
lock.lock();
document.getElementById('unlock').addEventListener('click', event => {
    event.preventDefault();
    lock.unlock();
});

// Old API: transfer
worker.postMessage({sharedBuffer}, [sharedBuffer]);

// New API: clone
// worker.postMessage({sharedBuffer});
