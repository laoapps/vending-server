const sspLib = require('encrypted-smiley-secure-protocol');



const WebSocket = require('ws');
const server = new WebSocket.Server({
    port: 8888
});

let sockets = [];
const notes =new Array();
notes.push({
    value:1000,
    amount:0,
    curreny:'LAK',
    channel:1,
})
notes.push({
    value:2000,
    amount:0,
    curreny:'LAK',
    channel:2,
})
notes.push({
    value:5000,
    amount:0,
    curreny:'LAK',
    channel:5,
})
notes.push({
    value:10000,
    amount:0,
    curreny:'LAK',
    channel:10,
})
notes.push({
    value:20000,
    amount:0,
    curreny:'LAK',
    channel:20,
})
notes.push({
    value:50000,
    amount:0,
    curreny:'LAK',
    channel:50,
})
notes.push({
    value:100000,
    amount:0,
    curreny:'LAK',
    channel:100,
})

const bankNotes =[];
const badBN=[];
   let eSSP = new sspLib({
        id: 0,
        debug: false,
        timeout: 3000,
        fixedKey: '0123456701234567'
    });
server.on('connection', function (socket) {
    sockets.push(socket);

    // When you receive a message, send that message to every socket.
    socket.on('message', function (msg) {
        sockets.forEach(s => s.send(JSON.stringify({bankNotes,badBN,notes})));
    });

    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function () {
        sockets = sockets.filter(s => s !== socket);
    });

    setInterval(() => {
        const bn=sumBN(bankNotes);
        sockets.forEach(s => s.send(JSON.stringify({bankNotes:bn,badBN,notes})));
    }, 30000);
    initSSP(socket);
   
});

function initSSP(socket){
 

    eSSP.on('OPEN', () => {
        console.log('open');

        eSSP.command('SYNC')
            .then(() => eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }))
            .then(() => eSSP.initEncryption())
            .then(() => eSSP.command('GET_SERIAL_NUMBER'))

            .then(result => {
                console.log('SERIAL NUMBER:', result.info.serial_number)
                return;
            })
            .then(() => eSSP.command('DISPLAY_ON'))

            // .then(() => eSSP.command('UNIT_DATA'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('Device unit data', result.info)
            //     }

            //     return;
            // })
            // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
            // .then(result => {
            //     if (result.status == 'OK') {

            //         console.log('Device value request', result.info)
            //     }

            //     return;
            // })
          
            .then(() => eSSP.command('SETUP_REQUEST'))
            .then(result => {
                if (result.status == 'OK') {

                    console.log('SETUP_REQUEST request', result.info)
                }
                return;
            })
            .then(() => eSSP.enable())
            .then(result => {
                if (result.status == 'OK') {
                    console.log('Device is active')
                }
                return;
            })
            // .then(() => eSSP.command('RESET'))
            // .then(result => {
            //     if (result.status == 'OK') {

            //         console.log('RESET request', result.info)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('SET_VALUE_REPORTING_TYPE',{reportBy:'value'}))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log(result);
                 
            //         console.log('SET_VALUE_REPORTING_TYPE', result)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('GET_NOTE_POSITIONS'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         const x = [];
            //         Object.keys(result.info.slot).forEach(k => {
            //             if (result.info.slot[k].value)
            //                 x.push(
            //                     (result.info.slot[k].value))
            //         })
            //         console.log('GET_NOTE_POSITIONS', x)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('PAYOUT_NOTE'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('PAYOUT_NOTE', result.info)
            //     }
            //     return;
            // })
            // // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
            // // .then(result => {
            // //     if (result.status == 'OK') {
                 
            // //         console.log('CHANNEL_VALUE_REQUEST', result)
            // //     }
            // //     return;
            // // })
            // .then(() => eSSP.command('GET_NOTE_POSITIONS'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         const x = [];
            //         console.log('GET_NOTE_POSITIONS',result.info.slot);
            //         // Object.keys(result.info.slot).forEach(k => {
            //         //     if (result.info.slot[k].value)
            //         //         x.push( result.info.slot[k].value)
            //         // })
            //         // console.log('GET_NOTE_POSITIONS', x)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('GET_DENOMINATION_ROUTE'))
            //     .then(result => {
            //         if (result.status == 'OK') {
            //             console.log('GET_DENOMINATION_ROUTE',result)
            //         }
            //         console.log('GET_DENOMINATION_ROUTE',result)
            //         return;
            //     })
        // .then(() => eSSP.command('SET_REFILL_MODE'))
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('SET_REFILL_MODE',result.info)
        //     }
        //     return;
        // })
        // .then(() => eSSP.command('FLOAT_BY_DENOMINATION'), {
        //     value: [
        //         {
        //             number: 1,
        //             denomination: 1000,
        //             country_code: 'LAK'
        //         }, {
        //             number: 1,
        //             denomination: 1000,
        //             country_code: 'LAK'
        //         }
        //     ],
        //     test: false
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('FLOAT_BY_DENOMINATION',result)
        //     }
        //     console.log('FLOAT_BY_DENOMINATION',result)
        //     return;
        // })
        // .then(() => eSSP.command('GET_DENOMINATION_ROUTE'),  {
        //     isHopper: true, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('GET_DENOMINATION_ROUTE',result)
        //     }
        //     console.log('GET_DENOMINATION_ROUTE',result)
        //     return;
        // })
        //  .then(() => eSSP.command('PAYOUT_BY_DENOMINATION'), {
        //     value: [
        //         {
        //             number: 1,
        //             denomination: 1000,
        //             country_code: 'LAK'
        //         }, {
        //             number: 1,
        //             denomination: 1000,
        //             country_code: 'LAK'
        //         }
        //     ],
        //     test: false
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('PAYOUT_BY_DENOMINATION',result)
        //     }
        //     console.log('PAYOUT_BY_DENOMINATION',result)
        //     return;
        // })
        // .then(() => eSSP.command('SMART_EMPTY'), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('SMART_EMPTY',result)
        //     }
        //     console.log('SMART_EMPTY',result)
        //     return;
        // })
        // .then(() => eSSP.command('FLOAT_AMOUNT', {
        //     min_possible_payout: 1000,
        //     amount: 1000,
        //     country_code: 'LAK',
        //     test: false
        // }), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('FLOAT_AMOUNT',result)
        //     }
        //     console.log('PAYOUT_AMOUNT',result)
        //     return;
        // })
        // .then(() => eSSP.command('PAYOUT_AMOUNT',{
        //     amount: 1000,
        //     country_code: 'LAK',
        //     test: false
        // }), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('PAYOUT_AMOUNT',result)
        //     }
        //     console.log('PAYOUT_AMOUNT',result)
        //     return;
        // })
        // .then(() => eSSP.command('GET_BAR_CODE_READER_CONFIGURATION'), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('GET_BAR_CODE_DATA',result)
        //     }
        //     console.log('GET_BAR_CODE_DATA',result)
        //     return;
        // })
        // .then(() => eSSP.command('GET_BAR_CODE_READER_CONFIGURATION'), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('GET_BAR_CODE_READER_CONFIGURATION',result)
        //     }
        //     console.log('GET_BAR_CODE_READER_CONFIGURATION',result)
        //     return;
        // })
        // .then(() => eSSP.command('GET_ALL_LEVELS'), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('GET_ALL_LEVELS',result)
        //     }
        //     console.log('GET_ALL_LEVELS',result)
        //     return;
        // })
        // .then(() => eSSP.command('GET_DENOMINATION_ROUTE'), {
        //     isHopper: false, // true/false
        //     value: 1000,
        //     country_code: 'LAK'
        // })
        // .then(result => {
        //     if (result.status == 'OK') {
        //         console.log('GET_NOTE_POSITIONS',result)
        //     }
        //     return;
        // })
        // .then(() => eSSP.command('FLOAT_AMOUNT', {
        //     min_possible_payout: 1000,
        //     amount: 10000,
        //     country_code: 'LAK',
        //     test: false
        // }))
        // .then(result => {
        //     if (result.status == 'OK') {

        //         console.log('Device value request', result.info)
        //     }else{
        //         console.log(result);
        //     }
        //     return;
        // })
    })

    eSSP.on('NOTE_REJECTED', result => {
        console.log('NOTE_REJECTED', result);

        eSSP.command('LAST_REJECT_CODE')
            .then(result => {
                console.log(result)
            })
    })
    eSSP.on('READ_NOTE', result => {
        console.log('READ_NOTE', result)
        
    })
    eSSP.on('CREDIT_NOTE', result => {
        console.log('CREDIT_NOTE', result)
        if(result.channel>0){
            const n =notes.find(v=>{
                return v.channel==result.channel;
            })
            if(n)
            bankNotes.push(n)
            else 
            badBN.push(result.channel)
        }
        const bn=sumBN(bankNotes);
       
        socket.send(JSON.stringify({bankNotes:bn,badBN,notes,command:'CREDIT_NOTE'}));
    })
    eSSP.on('JAMMED', result => {
        console.log('JAMMED', result)
        
    })
    eSSP.on('DISPENSED', result => {
        console.log('DISPENSED', result)
        
    })
    eSSP.on('JAM_RECOVERY', result => {
        console.log('JAM_RECOVERY', result)
        
    })
    process.on("exit", ()=>{
        eSSP.close();
    })
}
function sumBN(BN){
const bn=[];
BN.forEach(v=>{
    if(!bn.length) {
        const y = JSON.parse(JSON.stringify(v));
        y.amount++;
        bn.push(y);
    }
    else{
        const x =bn.find(vx=>vx.value==v.value)
        if(x)x.amount++;
        else {
            const x = JSON.parse(JSON.stringify(v));
            x.amount++;
            bn.push(x);
        }
    }
})
return bn;
}

setTimeout(() => {
    eSSP.open('COM1');
}, 3000);




















