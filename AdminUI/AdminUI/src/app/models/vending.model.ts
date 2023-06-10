export interface VENDING_Login {
    phonenumber: string,
    password: string
}
export interface VENDING_FindVendingCoin {
    ownerUuid: string
}
export interface VENDING_TextHashVerify {
    ownerUuid: string,
    sender: string,
    hashM: string,
    info: string
}
export interface VENDING_QRHashVerify {
    ownerUuid: string,
    sender: string,
    hashM: string,
    info: string,
    QRMode: string
}






export interface VENDING_FindMerchant {
    ownerUuid: string
}
export interface VENDING_CreateMerchant {
    ownerUuid: string,
    username: string,
    platform: string
}

export interface VENDING_FindMerchantCoin {
    ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_CreateMerchantCoin {
    ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_ShowMerchantCoinBalance {
    ownerUuid: string,
    name: string
}
export interface VENDING_MerchantCoinTransfer {
    ownerUuid: string,
    coinListId: string,
    coinCode: string,
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    limitBlock: number
}
export interface VENDING_ShowMerchantReport {
    ownerUuid: string,
    sender: string,
    page: number,
    limit: number
}







export interface VENDING_FindVendingLimiter {
    ownerUuid: string
}
export interface VENDING_CreateVendingLimiter {
    ownerUuid: string,
    username: string,
    platform: string
}

export interface VENDING_FindVendingLimiterCoin {
    ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_CreateVendingLimiterCoin {
    ownerUuid: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_ShowVendingLimiterCoinBalance {
    ownerUuid: string,
    name: string
}
export interface VENDING_VendingLimiterCoinTransfer {
    ownerUuid: string,
    coinListId: string,
    coinCode: string,
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    limitBlock: number
}
export interface VENDING_ShowVendingLimiterReport {
    ownerUuid: string,
    sender: string,
    page: number,
    limit: number
}






export interface VENDING_FindVendingWallet {
    ownerUuid: string,
    machineId: string,
}
export interface VENDING_CreateVendingWallet {
    ownerUuid: string,
    username: string,
    platform: string,
}
export interface VENDING_FindVendingWalletCoin {
    ownerUuid: string,
    machineId: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_CreateVendingWalletCoin {
    ownerUuid: string,
    machineId: string,
    // coinListId: string,
    // coinCode: string
}
export interface VENDING_ShowVendingWalletCoinBalance {
    ownerUuid: string,
    machineId: string,
    name: string
}
export interface VENDING_VendingWalletCoinTransfer {
    ownerUuid: string,
    machineId: string,
    coinListId: string,
    coinCode: string,
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    limitBlock: number
}
export interface VENDING_ShowVendingWalletReport {
    ownerUuid: string,
    machineId: string,
    sender: string,
    page: number,
    limit: number
}