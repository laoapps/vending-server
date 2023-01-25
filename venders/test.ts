//import { initWs } from "./services/service";

const sspLib = require('encrypted-smiley-secure-protocol');
var eSSP = new sspLib({
    id: 0,
    debug: false,
    timeout: 3000,
    fixedKey: '0123456701234567'
});
init();
eSSP.open('/dev/tty.usbserial-A10LOXD6').then(r => {
    console.log('OPEN', r);

}).catch(e => {
    console.log('ERROR OPEN COM1', e);
});

function init() {
    eSSP.on('OPEN', () => {
        console.log('open');

        eSSP.command('SYNC')
            .then(() => eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }))
            // .then(() => eSSP.initEncryption())
            .then(() => eSSP.command('GET_SERIAL_NUMBER'))
            .then(result => {
                console.log('SERIAL NUMBER:', result.info.serial_number)
                return;
            })
            .then(() => eSSP.command('DISPLAY_ON'))
            .then(result => {
                if (result.status == 'OK') {
                    console.log('DISPLAY_ON', result.info)
                }
            })

            .then(() => eSSP.command('SETUP_REQUEST'))
            .then(result => {
                if (result.status == 'OK') {

                    console.log('SETUP_REQUEST request', result.info)
                }
                return;
            })
            .then(() => eSSP.command('SET_CHANNEL_INHIBITS', { channels: [1, 1, 1, 1, 1, 1, 1] })
                .then(result => {
                    if (result.status == 'OK') {
                        console.log('SET_CHANNEL_INHIBITS', result.info)
                    }
                })
            )
            .then(() => eSSP.enable()
                .then(result => {
                    if (result.status == 'OK') {
                        console.log('Device is active', result.info)
                    }
                }))

        // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
        // .then(result => {
        //     if (result.status == 'OK') {

        //         console.log('Device value request', result.info)
        //     }

        //     return;
        // })// get info from the validator and store useful vars

        // inhibits, this sets which channels can receive notes
        // NV11.SetInhibits(textBox1);
        // enable, this allows the validator to operate
        // NV11.EnableValidator(textBox1);
        // value reporting, set whether the validator reports channel or coin value in 
        // subsequent requests
        // NV11.SetValueReportingType(false, textBox1);
        // check for notes already in the float on startup
        // NV11.CheckForStoredNotes(textBox1);


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

        // eSSP.command('LAST_REJECT_CODE')
        //     .then(result => {
        //         console.log(result)
        //         eSSP.disable();
        //     setTimeout(() => {
        //         eSSP.enable();
        //     }, 3000);
        //     })
            
    })

    eSSP.on('READ_NOTE', result => {
        console.log('READ_NOTE', result)

    })
    eSSP.on('CREDIT_NOTE', result => {
        console.log('CREDIT_NOTE', result)
        if (result.channel > 0) {

        }

    })
    eSSP.on('JAMMED', result => {
        console.log('JAMMED', result)
        // eSSP.disable();
        // setTimeout(() => {
        //     eSSP.enable();
        // }, 3000);
    })
    eSSP.on('DISPENSED', result => {
        console.log('DISPENSED', result)

    })
    eSSP.on('JAM_RECOVERY', result => {
        console.log('JAM_RECOVERY', result)

    })
    process.on("exit", () => {
        console.log('PROCESS EXIT');

        eSSP.close();
    })
}
