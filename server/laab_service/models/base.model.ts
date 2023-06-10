export interface IBase {
    id?: number,
    uuid?: string
}


export enum IVendingWalletType {
    merchant = 'merchant',
    vendingLimiter = 'vending limiter',
    vendingWallet = 'vending wallet'
}