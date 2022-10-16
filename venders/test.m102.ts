
    // process.on('exit', (code: number) => {
    //     // port.close();
    //     port.close(()=>{
    //         console.log('port closed');

    //     });
    // });







    /// ***********************

    // VM102





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
    const path = '/dev/ttyUSB0';
    const port = new SerialPort({ path: path, baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
        console.log(`port ${path} accessed`);




        var b = '';
        port.on('data', function (data: any) {
            console.log('data', data);
            b += new String(data);
            console.log('buffer', b);


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
        let check ='';
        const buff =['01', '05', int2hex(1), '02', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00'];
        check =checkSum(buff)
        const x = buff.join('') + check;
        port.write(Buffer.from(x, 'hex'), (e) => {
            if (e) {
                 console.log('Error: ', e.message)
            } else {
                 console.log('write succeeded');
            }
        })
       
       
     })


















    process.on('exit', (code: number) => {
        // port.close();
        port.close(()=>{
            console.log('port closed');

        });
    });
