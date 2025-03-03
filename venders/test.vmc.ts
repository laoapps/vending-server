


import { SerialPort } from 'serialport';
import { chk8xor } from './services/service';



// const buff = ['01', '03', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00']

// const x = checkSum(buff);
// console.log(x);
// /dev/tty      /dev/ttyS0  /dev/ttyS2  /dev/ttyS4    /dev/ttyUSB1  /dev/ttyUSB3
// /dev/ttyFIQ0  /dev/ttyS1==> ok  /dev/ttyS3  /dev/ttyUSB0  /dev/ttyUSB2  /dev/ttyUSB4
const path = '/dev/ttyS0';
const port = new SerialPort({ path: path, baudRate: 57600 }, function (err) {
    if (err) {
        return console.log('Error: ', err.message)
    }
    console.log(`port ${path} accessed`);

    var b = '';

    port.on('data', function (data: any) {
        b = data.toString('hex');
        console.log('===>BUFFER', b);
        let buff = checkCommandsForSubmission()||Array<string>();
        if (b == 'fafb410040'&&buff.length) {// POLL

                let x = buff.join('');
                console.log('X command',new Date().getTime(), x,(Buffer.from(x, 'hex')));
                port.write(Buffer.from(x, 'hex'), (e) => {
                    if (e) {
                        console.log('Error command', e.message);
                    } else {
                        console.log('WRITE COMMAND succeeded',new Date().getTime());
                        // confirm by socket
                    }
                })
        }
        else if(b=='fafb420043'){// ACK 
            console.log('ACK COMMAND FROM VMC and it has to send to the server with current transactionID');
            console.log('shift the current command and add new command for demo');
            commands.shift();
            commands.push(['fa', 'fb', '06', '05',getNextNo(),'01','00','00','01']);
        }
        else {
            // 0xfa 0xfb 0x42 0x00 0x43
            buff = getACK();
            let x = buff.join('')
            console.log('X ACK', x,(Buffer.from(x, 'hex')));
            port.write(Buffer.from(x, 'hex'), (e) => {
                if (e) {
                    console.log('Error: ', e.message)
                } else {
                    console.log('write ACK succeeded');

                }
            })
        }
        b='';
    });

    function getACK() {

        let buff = ['fa', 'fb'];
        buff.push('42');
        buff.push('00'); // default length 00
        buff.push('00'); 
        buff[buff.length-1]=chk8xor(buff)
        return buff;
    }
    //4.3.2 Upper computer selects to buy (Upper computer sends out)
   // const commands = [['fa', 'fb', '03', '03', getNextNo(),'00', int2hex(Number('01'))]]

    // const commands = [['fa', 'fb', '63', '01']]
    // const commands = [['fa', 'fb', '08', '00']]
    // Selection Test
    // const commands = [['fa', 'fb', '38', '01', '00', '01']]
     // Read machineID
    //  const commands = [['fa', 'fb', '08', '00']]
    let no=0;
    function getNextNo(){
        no++;
        if(no>=255){
            no=0;
        }
        return (no+'').length===1?'0'+no:no+'';
    }

    const commands = [['fa', 'fb', '06', '05',getNextNo(),'01','00','00','01']]
    function checkCommandsForSubmission() {
        const x = JSON.parse(JSON.stringify(commands[0]))as Array<string>;
        x.push('00')
        x[x.length-1]=chk8xor(x)
        return x;
    }
    function int2hex(i: number) {
        const str = Number(i).toString(16);
        return str.length === 1 ? '0' + str : str;
    }
  
    // const param = { slot: 48 }
    // const buffer = ['01', '05', int2hex(param.slot), '02', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];

    // CHECK HARDWARE VERSION 
    // const buff = ['01', '01', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '71', '88'];
    // 
    // let check = '';
    // const buff = ['fa', 'fb'];
    // buff.push('41');
    // buff.push('00'); // default length 00
    // buff.push(chk8xor(buff))
    // let x = buff.join('') + check;


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

    // fafb
    // 52 // 
    // 21 // length
    // c4 // communication number
    // 01 // bill acceptor status
    // 01 // coin acceptor status
    // 00 // card reader status
    // 00 // temperature controll status
    // 00 // temperature 
    // 00 // door status
    // 00000000 // bill change
    // 00000000 // coin change
    // 30303030303030303030 // machine ID
    // aaaaaaaaaaaaaaaab6

})







// VMC dispensing status
// buffer fafb
// 04
// 04 length
// 3f
// 0100
// 01
// 3e
// x ACK fafb420043 <Buffer fa fb 42 00 43>
// write ACK succeeded
// buffer fafb04044003000143
// x ACK fafb420043 <Buffer fa fb 42 00 43>
// write ACK succeeded
// buffer fafb110c410001000026ac0404000103d4
// x ACK fafb420043 <Buffer fa fb 42 00 43>
// write ACK succeeded










process.on('exit', (code: number) => {
    // port.close();
    port.close(() => {
        console.log('port closed');

    });
});
