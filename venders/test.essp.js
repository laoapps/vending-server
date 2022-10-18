const sspLib = require('encrypted-smiley-secure-protocol');
import axios from 'axios';
import moment from 'moment';

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
            .then(result => {
                if (result.status == 'OK') {
                    console.log('DISPLAY_ON', result.info)
                }
            })
            .then(() => eSSP.enable())
            .then(result => {
                if (result.status == 'OK') {
                    console.log('Device is active')
                }
                return;
            })
            .then(() => eSSP.command('SETUP_REQUEST'))
            .then(result => {
                if (result.status == 'OK') {

                    console.log('SETUP_REQUEST request', result.info)
                }
                return;
            })
            // .then(() => eSSP.command('SET_CHANNEL_INHIBITS',{channels:[1,1,1,1,1,1,1]})
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('SET_CHANNEL_INHIBITS', result.info)
            //     }
            // })
            //     return;
            // })
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
        const bnx = bankNotes[bankNotes.length-1];
        refillMMoney(bnx.value,'CREDIT_NOTE '+result.channel);
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

function checkSum(toMsisdn, amount, description,remark1,remark2,remark3,remark4) {
    //const hash = crypto.createHash('sha256').update(pwd).digest('base64');
    //const input_str = `REF,2055220199,150000,LAK,ໝາເຫດ,ເລກອ້າງອິງ01,ເລກອ້າງອິງ02,ເລກອ້າງອິງ03,ເລກອ້າງອິງ04,ltc`;
  

    const input_str = `REF,${toMsisdn},${amount},LAK,${description},${remark1},${remark2},${remark3},${remark4},ltc`;
  
    //const input_str = "REF,2055220199,1000,LAK,,,,,,ltc";
    const hash = crypto.createHash("sha256").update(input_str).digest("base64");
  
    return hash;
  }
function refillMMoney(amount,description,remark1='',remark2='',remark3='',remark4=''){
    const msisdn =2054656226;
    return new Promise<any>((resolve,reject)=>{
        try {
            const mySum = checkSum(msisdn,amount,description,remark1,remark2,remark3,remark4);
            if(moment(mmMoneyLogin.expiry).isBefore(moment())){
                loginMmoney().then(r=>{
                    mmMoneyLogin=r;
                    processRefillMmoney().then(r=>{
                        console.log('DATA processRefillMmoney',r);
                        resolve(r)
                    }).catch(e=>{
                        console.log('ERROR processRefillMmoney',r);
                        reject(e)
                    });

                }).catch(e=>{
                    console.log('ERROR loginMmoney',r);
                    reject(e)
                })
            }else{
                processRefillMmoney().then(r=>{
                    console.log('DATA processRefillMmoney',r);
                    resolve(r)
                }).catch(e=>{
                    console.log('ERROR processRefillMmoney',r);
                    reject(e)
                });
            }
        } catch (error) {
            console.log('ERROR refillMMoney',error);
            reject(error)
        }
        
    })
    
}

const mmMoneyLogin={
    accessToken:'',
      tokenType: '',
            expiresIn: number,
                userName: string,
                issued: string,
                expiry: string
};
function processRefillMmoney(transID,value,remark){
    return new Promise<any>((resolve,reject)=>{
        requestMmoneyCashin(transID,value,remark).then(r=>{
            console.log('DATA requestMmoneyCashin',r);
            // {
            //     "22162": "73494",
            //     "transData": [
            //         {
            //             "transCashInID": "20221018110924835233",
            //             "transStatus": "R",
            //             "accountNo": "XXXXXX6226",
            //             "accountNameEN": "Sengkham Latthamone",
            //             "accountRef": "2054656226",
            //             "accountType": "TC WALLET",
            //             "transExpiry": "2022-10-18 11:14:24.835"
            //         }
            //     ],
            //     "responseCode": "0000",
            //     "responseMessage": "Operation success",
            //     "responseStatus": "SUCCESS",
            //     "transID": "202210141402042100639",
            //     "processTime": 23,
            //     "serverDatetime": "2022-10-18 11:09:24",
            //     "serverDatetimeMs": 1666066164838
            // }
            const x = r.transData[0];
            confirmMmoneyCashin(value,r.transID,x.transCashInID,remark).then(rx=>{
                console.log('Succeeded confirmMmoneyCashin',rx);
            }).catch(e=>{
                console.log('ERROR confirm Mmoney Cashin',e);
            })
        }).catch(e=>{
            console.log('ERROR requestMmoneyCashin',e);
            reject(e);
        })
    });
}
function loginMmoney(){
    const url ='http://115.84.121.101:31153/ewallet-ltc-api/oauth/token.service';
    return new Promise<any>((resolve,reject)=>{
        // const data={
        //     username:'Dokbuakham',
        //     password:'Ko8-En6;',
        //     grant_type:'client_credentials'
        // }
        const params = new URLSearchParams();
        params.append('username', 'Dokbuakham');
        params.append('password', 'Ko8-En6;');
        params.append('grant_type', 'client_credentials');
        axios.post(url,params,{headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }}).then(r=>{
            console.log('DATA ',r.data);
            resolve(r.data);
            // {
            //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
            //     "tokenType": "Bearer",
            //     "expiresIn": 86400000,
            //     "userName": "Dokbuakham",
            //     "issued": "2022-10-17 23:33:40",
            //     "expiry": "2022-10-18 23:33:40"
            // }
        }).catch(e=>{
            console.log('ERROR',e);
            reject(e);
        })
    })
   
}
function requestMmoneyCashin(transID,value,remark='Test Cash In'){
    const url ='http://115.84.121.101:31153/ewallet-ltc-api/cash-management/request-cash-in.service';
    return new Promise<any>((resolve,reject)=>{
            const data={
                apiKey: "b7b7ef0830ff278262c72e57bc43d11f",
                apiToken: mmMoneyLogin.accessToken,
                transID,
                requestorID: 69,
                toAccountOption: "REF",
                toAccountRef: "2054656226",
                transAmount: value,
                transCurrency: "LAK",
                transRemark: remark,
                transRefCol1: "",
                transRefCol2: "",
                transRefCol3: "",
                transRefCol4: "",
                transCheckSum: ""
            }
            data.transCheckSum = checkSum(data.toAccountRef,data.value,data.transRemark,data.remark1,data.remark2,data.remark3,data.remark4);
            axios.post(url,params,{headers: {
                'Content-Type': 'application/json'
            }}).then(r=>{
                console.log('DATA requestMmoneyCashin',r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e=>{
                console.log('ERROR requestMmoneyCashin',e);
                reject(e);
            })
            
        })

}

function confirmMmoneyCashin(value,transID,transCashInID,remark='Test Cash In'){
    const url ='http://115.84.121.101:31153/ewallet-ltc-api/cash-management/confirm-cash-in.service';
    return new Promise<any>((resolve,reject)=>{
            const data={
                apiKey: "efca1d20e1bdfc07b249e502f007fe0c",
                apiToken: mmMoneyLogin.accessToken,
                transID,
                requestorID: 69,
                transCashInID
            }
            
            data.transCheckSum = checkSum(data.toAccountRef,data.value,data.transRemark,data.remark1,data.remark2,data.remark3,data.remark4);

            axios.post(url,params,{headers: {
                'Content-Type': 'application/json'
            }}).then(r=>{
                console.log('DATA confirmMmoneyCashin',r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e=>{
                console.log('ERROR confirmMmoneyCashin',e);
                reject(e);
            })
            
        })

}

function inquiryMmoneyCashin(transID,transCashInID){
    const url ='http://115.84.121.101:31153/ewallet-ltc-api/cash-management/inquiry-cash-in.service';
    return new Promise<any>((resolve,reject)=>{
            const data={
                apiKey: "efca1d20e1bdfc07b249e502f007fe0c",
                apiToken: mmMoneyLogin.accessToken,
                transID,
                requestorID: 69,
                transCashInID
            }
            axios.post(url,params,{headers: {
                'Content-Type': 'application/json'
            }}).then(r=>{
                console.log('DATA inquiryMmoneyCashin ',r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e=>{
                console.log('ERROR inquiryMmoneyCashin',e);
                reject(e);
            })
            
        })

}



















