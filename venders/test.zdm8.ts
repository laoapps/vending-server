import { SerialPort } from 'serialport';

    import crc from 'crc';

    function checkSum(buff: any) {
        try {
            let x = crc.crc16modbus(Buffer.from(buff.join(''), 'hex')).toString(16);
            x.length<4?x='0'+x:'';
            console.log(x);
            console.log(x.substring(2) + x.substring(0, 2));
            
            return x.substring(2) + x.substring(0, 2);
        }
        catch (e) {
            console.log('error', e);
            return '';
        }
    }

    // const buff = ['01', '03', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00']

    // const x = checkSum(buff);
    // console.log(x);
    // /dev/tty      /dev/ttyS0  /dev/ttyS2  /dev/ttyS4    /dev/ttyUSB1  /dev/ttyUSB3
    // /dev/ttyFIQ0  /dev/ttyS1==> ok  /dev/ttyS3  /dev/ttyUSB0  /dev/ttyUSB2  /dev/ttyUSB4
    const path = '/dev/ttyS1';
    const port = new SerialPort({ path: path, baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
        console.log(`port ${path} accessed`);




        var b = '';
        // port.on('data', function (data: any) {
        //     console.log('data', data);
        //     b += new String(data);
        //     console.log('buffer', b);


        // });
        function int2hex(i: number) {
            const str = Number(i).toString(16);
            return str.length === 1 ? '0' + str : str;
        }
        // const param = { slot: 48 }
        // const buffer = ['01', '05', int2hex(param.slot), '02', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];

        // CHECK HARDWARE VERSION 
        // const buff = ['01','03', '00', '01', '00', '02', '95', 'CB'];
        // port.write(Buffer.from(buff.join(''), 'hex'), (e) => {
        //     if (e) {
        //          console.log('Error: ', e.message)
        //     } else {
        //          console.log('write succeeded');
        //     }
        // })
        // 01 03 04 21 12 0a 0a d6 ad
        // Android send->01 03 00 01 00 02 95 CB
        // ● 01: Slave address (driver board address, settable)
        // ● 03: Function code
        // ● 00 01: Hardware version number register
        // ● 00 02: Read word length
        // ● 95 CB: CRC check digit
        // Driver board return (example): 01 03 04 20 02 0A 0A D6 94
        // Description: The 1st~2nd byte is the hardware version of the driver board, which is the BCD code, indicating the year and month
        // For example: 0x20 0x02 means 20 years and 2 months

        // run motor
       
    //     const isspring = '01';
    //     const dropdetect = '00';
    //     const liftsystem = '00';
    //     // new Array(60).fill(0).forEach((v,i)=>{
    //     [8,29,45,56].forEach((v,i)=>{
    //         setTimeout(() => {
    //             const slot =  int2hex(v);
    //             console.log('position',slot,'i',i,'v',v,'\n');
                
    //             const buff = ['01', '10','20','01','00','02', '04',slot, isspring, dropdetect, liftsystem];
    //             const x = buff.join('') + checkSum(buff);
    //             console.log('write', x);
        
    //             // port.write(Buffer.from(x, 'hex'), (e) => {
    //             //     if (e) {
    //             //         console.log('Error: ', e.message)
    //             //     } else {
    //             //         console.log('write succeeded');
    //             //     }
    //             // })
    //         }, 3000*i);
           
    //     // })
       
     })






