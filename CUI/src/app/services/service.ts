

export interface IDevice {
  device: IUsbDevice;
  port: number;
  driver?: object;
}
export interface IUsbDevice {
    productId: number;
    vendorId: number;
    productName: string;
    deviceId: number;
  }