export interface VENDING_ShowVendingWalletCoinBalance {
    machineId: string
}
export interface VENDING_CashValidation {
    machineId: string
}
export interface VENDING_CashinValidation {
    machineId: string,
    cash: number,
    description: string
}
export interface VENDING_PaidValidation {
    machineId: string,
    cash: number,
    description: string
}
export interface VENDING_CreateSMC {
    machineId: string,
    cash: number,
    description: string
}
export interface VENDING_LoadSMC {
    machineId: string,
    page: number,
    limit: number
}
export interface VENDING_CreateEPIN {
    machineId: string,
    detail: any,
}