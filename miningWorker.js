let nonce = 0;
let miningPower = 1.0;
let difficulty = 2.0;
let isActive = true;

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function mine() {
    const startTime = Date.now();
    let hashes = 0;
    
    while (Date.now() - startTime < 100 && isActive) {
        const data = `${Date.now()}-${nonce}`;
        const hash = await sha256(data);
        
        postMessage({ type: 'hash', hash });
        
        nonce++;
        hashes++;
    }
    
    if (isActive) {
        setTimeout(mine, 0);
    }
}

onmessage = function(e) {
    if (e.data.type === 'start') {
        isActive = true;
        miningPower = e.data.miningPower;
        difficulty = e.data.difficulty;
        mine();
    } else if (e.data.type === 'stop') {
        isActive = false;
    }
}; 