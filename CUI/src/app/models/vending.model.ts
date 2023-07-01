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





export enum ITopupServiceMenu {
    phone_payment='phone_payment',
    electricity_payment='electricity_payment',
    water_payment='water_payment',
    leasing_payment='leasing_payment',
    bill_payment='bill_payment',
    insurance_payment='insurance_payment',
    banking_insitute='banking_insitute',
    road_tax='road_tax',
    land_tax='land_tax',
    loan='loan',
    queue_booking='queue_booking',
    find_a_job='find_a_job',
    renting_service='renting_service'
}