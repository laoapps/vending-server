

export interface IDevice {
  device: IUsbDevice;
  port: number;
  driver?: object;
}
export interface IVideoList{
  id: number;
  name: string;
  title: string;
  description: string;
  url: any;
  image: string;
}
export function  hex2dec(hex: string) {
  try {
      return parseInt(hex, 16);
  } catch (error) {
      return -1;
  }

}
export interface IUsbDevice {
    productId: number;
    vendorId: number;
    productName: string;
    deviceId: number;
  }
  export interface IMachineStatus{lastUpdate: Date;billStatus: string;coinStatus: string;cardStatus: string;tempconrollerStatus: string;temp: string;doorStatus: string;billChangeValue: string;coinChangeValue: string;machineIMEI: string;allMachineTemp: string}
export function  machineStatus(x: string): IMachineStatus{
  let y: any;
  let b = '';
  try {
    y= JSON.parse(x);
   b = y.b;
  } catch (error) {
    console.log('error',error);
    return {} as IMachineStatus;
  }
  // fafb52215400010000130000000000000000003030303030303030303013aaaaaaaaaaaaaa8d
  // fafb52
  // 21 //len
  // 54 // series
  const billStatus =b.substring(10,12);
  // 00 // bill acceptor
  const coinStatus=b.substring(12,14);
  // 01 // coin acceptor
 const cardStatus= b.substring(14,16);
  // 00 // card reader status
  const tempconrollerStatus= b.substring(16,18);
  // 00 // tem controller status
  const temp= b.substring(18,20);
  // 13 // temp
  const doorStatus= b.substring(20,22);
  // 00 // door
  const billChangeValue= b.substring(22,30);
  // 00000000 // bill change
  const coinChangeValue=b.substring(30,38);
  // 00000000 // coin change
  const machineIMEI= b.substring(38,58);
  // 30303030303030303030
  const allMachineTemp= b.substring(58,74);
  // 13aaaaaaaaaaaaaa8d
  // // fafb header
  // // 52 command
  // // 01 length
  // // Communication number+
  // '00'//Bill acceptor status+
  // '00'//Coin acceptor status+
  // '00'// Card reader status+
  // '00'// Temperature controller status+
  // '00'// Temperature+
  // '00'// Door status+
  // '00 00 00 00'// Bill change(4 byte)+
  // '00 00 00 00'// Coin change(4 byte)+
  // '00 00 00 00 00 00 00 00 00 00'//Machine ID number (10 byte) +
  // '00 00 00 00 00 00 00 00'// Machine temperature (8 byte, starts from the master machine. 0xaa Temperature has not been read yet) +
  // '00 00 00 00 00 00 00 00'//  Machine humidity (8 byte, start from master machine)
  return {lastUpdate:new Date(y.t),billStatus,coinStatus,cardStatus,tempconrollerStatus,temp,doorStatus,billChangeValue,coinChangeValue,machineIMEI,allMachineTemp};
}
