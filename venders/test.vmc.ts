


import { SerialPort } from 'serialport';
import { chk8xor } from './services/service';



// const buff = ['01', '03', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00']

// const x = checkSum(buff);
// console.log(x);
// /dev/tty      /dev/ttyS0  /dev/ttyS2  /dev/ttyS4    /dev/ttyUSB1  /dev/ttyUSB3
// /dev/ttyFIQ0  /dev/ttyS1==> ok  /dev/ttyS3  /dev/ttyUSB0  /dev/ttyUSB2  /dev/ttyUSB4
const path = '/dev/ttyS1';
const port = new SerialPort({ path: path, baudRate: 57600 }, function (err) {
    if (err) {
        return console.log('Error: ', err.message)
    }
    console.log(`port ${path} accessed`);

    var b = '';
    port.on('data', function (data: any) {
        b += data.toString('hex');
        console.log('buffer', b);
        if (b == 'fafb410040') {// POLL
            // 0xfa 0xfb 0x42 0x00 0x43
            let check = '';
            const buff = ['fa', 'fb'];
            buff.push('42');
            buff.push('00'); // default length 00
            buff.push(chk8xor(buff))
            let x = buff.join('') + check;
            console.log('x',x);
            port.write(Buffer.from(x, 'hex'), (e) => {
                if (e) {
                    console.log('Error: ', e.message)
                } else {
                    console.log('write succeeded');
                }
            })
        }

        b = '';


    });
    function int2hex(i: number) {
        const str = Number(i).toString(16);
        return str.length === 1 ? '0' + str : str;
    }
    // const param = { slot: 48 }
    // const buffer = ['01', '05', int2hex(param.slot), '02', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];

    // CHECK HARDWARE VERSION 
    // const buff = ['01', '01', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '71', '88'];
    // 
    let check = '';
    const buff = ['fa', 'fb'];
    buff.push('41');
    buff.push('00'); // default length 00
    buff.push(chk8xor(buff))
    let x = buff.join('') + check;


    // buff.push('03');
    // const series=0;
    // const slot = '00';
    // const params=['00','00']
    // const y = [series].concat(params.map(v => int2hex(v)))
    //         buff.push(int2hex(x.length));//length
    //         // p.push(parseInt(p.length+'', 16));
    //         buff.push(int2hex(series));// 
    //         buff.push(slot);// slot 
    //         buff.push(chk8xor(buff))
    //     }
    // let x = buff.join('') + check;
    // port.write(Buffer.from(x, 'hex'), (e) => {
    //     if (e) {
    //          console.log('Error: ', e.message)
    //     } else {
    //          console.log('write succeeded');
    //     }
    // })


})


















process.on('exit', (code: number) => {
    // port.close();
    port.close(() => {
        console.log('port closed');

    });
});
