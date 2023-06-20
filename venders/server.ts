
import { SocketKiosClient } from './api/socketClient.kiosk';
import { SocketClientM102 } from './api/socketClient.m102';
import { SocketClientVMC } from './api/socketClient.vmc';
import { SocketClientZDM8 } from './api/socketClient.zdm8';

const env = process.env.pname;
if(env=='nv9'){
// const x =new SocketKiosClient();
process.on('exit', (code: number) => {
    // port.close();
});
}else if(env =='zdm8'){
    const clients =[

        new SocketClientZDM8()];
      
        process.on('exit', (code:number)=>{
          console.log('exit code',code);
          
          clients.forEach(v=>{
            v.close();
          })
        });
      
}else if(env=='m102'){
    const clients =[

        new SocketClientM102()];
      
        process.on('exit', (code:number)=>{
          console.log('exit code',code);
          
          clients.forEach(v=>{
            v.close();
          })
        });
}else if(env=='vmc'){
    const clients =[

        new SocketClientVMC()];
      
        process.on('exit', (code:number)=>{
          console.log('exit code',code);
          
          clients.forEach(v=>{
            v.close();
          })
        });
}




    
        



