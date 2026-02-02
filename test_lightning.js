const fs = require('fs');
const log = (msg) => {
    console.log(msg);
    try { fs.appendFileSync('debug_lightning.log', msg + '\n'); } catch (e) { }
}
try {
    log('Starting require lightningcss...');
    require('lightningcss');
    log('Success requiring lightningcss');
} catch (e) {
    log('Error requiring lightningcss: ' + e.stack);
}
