interface IBase {
    token: string
}
export interface VENDING_ShowVendingWalletCoinBalance extends IBase {}
export interface VENDING_CashValidation extends IBase {}

export interface VENDING_CashinValidation extends IBase {
    cash: number,
    description: string
}
export interface VENDING_PaidValidation extends IBase {
    cash: number,
    description: string
}
export interface VENDING_CreateSMC extends IBase {
    cash: number,
    description: string
}
export interface VENDING_LoadSMC extends IBase {
    page: number,
    limit: number
}
export interface VENDING_CreateEPIN extends IBase {
    detail: any,
}
export interface VENDING_TransferValidation extends IBase {
    receiver: string,
    cash: number,
    description: string
}