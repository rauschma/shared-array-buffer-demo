importScripts('lock_es6.js');
self.addEventListener('message', function (event) {
    const {sharedBuffer} = event.data;
    const lock = new Lock(new Int32Array(sharedBuffer), 0);
    self.postMessage('Waiting for lock...');
    lock.lock(); // blocks!
    self.postMessage('Unlocked');
});
