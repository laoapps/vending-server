interface IBase {
    token: string
}
export interface VENDING_Login {
    phonenumber: string,
    password: string
}
export interface VENDING_FindVendingCoin extends IBase {
    ownerUuid: string
}
export interface VENDING_TextHashVerify extends IBase {
    // ownerUuid: string,
    sender: string,
    hashM: string,
    info: string
}
export interface VENDING_QRHashVerify extends IBase {
    // ownerUuid: string,
    sender: string,
    hashM: string,
    info: string,
    QRMode: string
}






export interface VENDING_FindMerchant extends IBase {
    ownerUuid: string
}
export interface VENDING_CreateMerchant extends IBase {
    // ownerUuid: string,
    username: string,
    platform: string
}

export interface VENDING_FindMerchantCoin extends IBase {
    // ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_CreateMerchantCoin extends IBase {
    // ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_ShowMerchantCoinBalance extends IBase {
    // ownerUuid: string,
    name: string
}
export interface VENDING_MerchantCoinTransfer extends IBase {
    // ownerUuid: string,
    coinListId: string,
    coinCode: string,
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    limitBlock: number
}
export interface VENDING_ShowMerchantReport extends IBase {
    // ownerUuid: string,
    sender: string,
    page: number,
    limit: number
}







export interface VENDING_FindVendingLimiter extends IBase {
    ownerUuid: string
}
export interface VENDING_CreateVendingLimiter extends IBase {
    // ownerUuid: string,
    username: string,
    platform: string
}

export interface VENDING_FindVendingLimiterCoin extends IBase {
    // ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_CreateVendingLimiterCoin extends IBase {
    // ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_ShowVendingLimiterCoinBalance extends IBase {
    // ownerUuid: string,
    name: string
}
export interface VENDING_VendingLimiterCoinTransfer extends IBase {
    // ownerUuid: string,
    coinListId: string,
    coinCode: string,
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    limitBlock: number
}
export interface VENDING_ShowVendingLimiterReport extends IBase {
    // ownerUuid: string,
    sender: string,
    page: number,
    limit: number
}






export interface VENDING_FindVendingWallet extends IBase {
    // ownerUuid: string,
    machineId: string,
}
export interface VENDING_CreateVendingWallet extends IBase {
    // ownerUuid: string,
    username: string,
    platform: string,
}
export interface VENDING_FindVendingWalletCoin extends IBase {
    // ownerUuid: string,
    machineId: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_CreateVendingWalletCoin extends IBase {
    // ownerUuid: string,
    machineId: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_ShowVendingWalletCoinBalance extends IBase {
    // ownerUuid: string,
    machineId: string,
    name: string
}
export interface VENDING_VendingWalletCoinTransfer extends IBase {
    // ownerUuid: string,
    machineId: string,
    coinListId: string,
    coinCode: string,
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    limitBlock: number
}
export interface VENDING_ShowVendingWalletReport extends IBase {
    // ownerUuid: string,
    machineId: string,
    sender: string,
    page: number,
    limit: number
}
export interface VENDING_ShowEPINShortCodeList extends IBase {
    counter: boolean,
    page: number,
    limit: number
}
export interface VENDING_FindEPINShortCodeList extends IBase {
    phonenumber: string,
    page: number,
    limit: number
}
export interface VENDING_ReCreateEPIN extends IBase {
    machineId: string,
    phonenumber: string,
    detail: any,
}









export interface VENDING_CounterCashout_cash extends IBase {
    machineId: string,
    phonenumber: string,
    destination: string,
    coinname: string,
    name: string
}






// sub admin
export interface VENDING_ShowSubadminList extends IBase {
    page: number,
    limit: number
}
export interface VENDING_FindSubadminList extends IBase {
    phonenumber: string,
    page: number,
    limit: number
}
export interface VENDING_CreateSubadmin extends IBase {
    phonenumber: string
}
export interface VENDING_DeleteSubadmin extends IBase {
    id: number,
    phonenumber: string
}
export interface VENDING_AddProvideToSubadmin extends IBase {
    id: number,
    phonenumber: string,
    machineId: string,
    imei: string
}