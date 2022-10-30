
 const sspLib = require('encrypted-smiley-secure-protocol');
 var eSSP = new sspLib({
    id: 0,
    debug: false,
    timeout: 3000,
    fixedKey: '0123456701234567'
});
eSSP.open('COM1').then(r=>{
    console.log('OPEN COM1',r);

}).catch(e=>{
    console.log('ERROR OPEN COM1',e);
});