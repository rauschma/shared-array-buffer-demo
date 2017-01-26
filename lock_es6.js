const UNLOCKED = 0;
const LOCKED_NO_WAITERS = 1;
const LOCKED_POSSIBLE_WAITERS = 2;

// Number of shared Int32 locations needed by the lock.
const NUMINTS = 1;

class Lock {

    // Create a lock object.
    //
    // 'iab' must be a Int32Array mapping shared memory.
    // 'ibase' must be a valid index in iab, the first of NUMINTS reserved for the lock.
    //
    // iab and ibase will be exposed on Lock.
    constructor(iab, ibase) {
        if (!(iab instanceof Int32Array && ibase|0 === ibase && ibase >= 0 && ibase+NUMINTS <= iab.length)) {
            throw new Error(`Bad arguments to Lock constructor: ${iab} ${ibase}`);
        }
        this.iab = iab;
        this.ibase = ibase;
    }

    // Initialize shared memory for a lock, before constructing the
    // worker-local Lock objects on that memory.
    //
    // 'iab' must be an Int32Array mapping shared memory.
    // 'ibase' must be a valid index in iab, the first of NUMINTS reserved
    // for the lock.
    //
    // Returns 'ibase'.
    static initialize(iab, ibase) {
        if (!(iab instanceof Int32Array && ibase|0 === ibase && ibase >= 0 && ibase+NUMINTS <= iab.length)) {
            throw new Error(`Bad arguments to Lock constructor: ${iab} ${ibase}`);
        }
        Atomics.store(iab, ibase, UNLOCKED);
        return ibase;
    }

    // Acquire the lock, or block until we can.  Locking is not recursive:
    // you must not hold the lock when calling this.
    lock() {
        const iab = this.iab;
        const stateIdx = this.ibase;
        var c;
        if ((c = Atomics.compareExchange(iab, stateIdx,
        UNLOCKED, LOCKED_NO_WAITERS)) !== UNLOCKED) {
            do {
                if (c === LOCKED_POSSIBLE_WAITERS
                || Atomics.compareExchange(iab, stateIdx,
                LOCKED_NO_WAITERS, LOCKED_POSSIBLE_WAITERS) !== UNLOCKED) {
                    Atomics.wait(iab, stateIdx,
                        LOCKED_POSSIBLE_WAITERS, Number.POSITIVE_INFINITY);
                }
            } while ((c = Atomics.compareExchange(iab, stateIdx,
            UNLOCKED, LOCKED_POSSIBLE_WAITERS)) !== UNLOCKED);
        }
    }

    // Attempt to acquire the lock, return true if it was acquired, false
    // if not.  Locking is not recursive: you must not hold the lock when
    // calling this.
    tryLock() {
        const iab = this.iab;
        const stateIdx = this.ibase;
        return Atomics.compareExchange(iab, stateIdx, UNLOCKED, LOCKED_NO_WAITERS) === UNLOCKED;
    }

    // Unlock a lock that is held.  Anyone can unlock a lock that is held;
    // nobody can unlock a lock that is not held.
    unlock() {
        const iab = this.iab;
        const stateIdx = this.ibase;
        var v0 = Atomics.sub(iab, stateIdx, 1);
        // Wake up a waiter if there are any
        if (v0 !== LOCKED_NO_WAITERS) {
            Atomics.store(iab, stateIdx, UNLOCKED);
            Atomics.wake(iab, stateIdx, 1);
        }
    }

    toString() {
        return "Lock:{ibase:" + this.ibase +"}";
    }
}