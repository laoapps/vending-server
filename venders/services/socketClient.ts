import net from 'net';
export class SocketClient {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client = new net.Socket();
    port = 22222;
    host = 'laoapps.com';
    machineid = '123456';
    token = '';
    constructor() {
        this.client.connect({
            port: this.port,
            host: this.host
        });
        this.client.on('connect', function () {
            // console.log('Client: connection established with server');

            // console.log('---------client details -----------------');
            // var address =this. client.address();
            // var port = address.port;
            // var family = address.family;
            // var ipaddr = address.address;
            // console.log('Client is listening at port' + port);
            // console.log('Client ip :' + ipaddr);
            // console.log('Client is IP4/IP6 : ' + family);


            // writing data to server
            this.client.write(JSON.stringify({ method: 'register', data: { machineid: this.machineid } }));

        });

        this.client.setEncoding('utf8');

        this.client.on('data', function (data) {
            console.log('Data from server:' + data);
            const {method,d}=JSON.parse(data.toString());
            if(method=='ping'){

            }else if(method=='dispense'){
                
            }else if(method == 'getinfo'){

            }else if (method == 'checkmotor'){

            }
            console.log(method,d);
            
        });
        this.client.on('error', function (data) {
            console.log('Data from server:' + data);
        });
        this.client.on('end', function (data) {
            console.log('Data from server:' + data);
        });

        setInterval(function () {
            // this.client.end('Bye bye server');
            this.client.write(JSON.stringify({ method: 'ping', token: this.token }));
        }, 5000);

       
    }

}