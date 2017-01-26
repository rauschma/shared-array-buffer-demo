(function () { // BEGIN iife
if (typeof SharedArrayBuffer !== 'function' || typeof Atomics !== 'object') {
    document.getElementById('output').textContent = 'This browser does not support SharedArrayBuffers!';
    return;
}

const worker = new Worker('worker.js');

// We display output for the worker
worker.addEventListener('message', function (event) {
    document.getElementById('output').textContent = event.data;
});

// Set up the shared memory
const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);

// Set up the lock
Lock.initialize(sharedArray, 0);
const lock = new Lock(sharedArray, 0);
lock.lock();

try {
    // Try new API (clone)
    worker.postMessage({sharedBuffer});
} catch (e) {
    // Fall back to old API (transfer)
    worker.postMessage({sharedBuffer}, [sharedBuffer]);
}

document.getElementById('unlock').addEventListener('click', event => {
    event.preventDefault();
    lock.unlock();
});

})(); // END iife
