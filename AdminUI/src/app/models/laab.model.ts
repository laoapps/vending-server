// merchant
interface LAAB_Base {
    phonenumber?: string,
    passkeys?: string

}
export interface LAAB_Login {
    phonenumber: string,
    password: string
}
export interface LAAB_Genpasskeys  extends LAAB_Base {
    token: string
}
export interface LAAB_FindMerchantAccount extends LAAB_Base {
    sender: string,
    phonenumber: string,
    passkeys: string
}
export interface LAAB_ShowMerchantBalance  extends LAAB_Base {
    sender: string,
}
export interface LAAB_RegisterMerchantAccount  extends LAAB_Base {
    sender: string,
    limitBlock: number
}
export interface LAAB_FindVendingCoin  extends LAAB_Base {
    search: string,
    page: number,
    limit: number,
    sender: string,
}
export interface LAAB_FindMerchantCoinAccount  extends LAAB_Base {
    sender: string,
    sendermerchant: boolean,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_RegisterMerchantCoinAccount  extends LAAB_Base {
    sender: string,
    sendermerchant: boolean,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_ShowMerchantCoinBalance  extends LAAB_Base {
    sender: string,
}
export interface LAAB_MerchantTransfer  extends LAAB_Base {
    sender: string,
    receiver: string,
    amount: number,
    description: string,
}
export interface LAAB_FindMyVendingLimiterAccount extends LAAB_Base {
    sender: string,
    phonenumber: string,
    passkeys: string
}
export interface LAAB_RegisterVendingLimiterAccount  extends LAAB_Base {
    sender: string,
    limitBlock: number
}
export interface LAAB_FindVendingLimiterCoinAccount  extends LAAB_Base {
    sender: string,
    senderVendingLimiter: boolean,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_ShowVendingLimiterCoinBalance  extends LAAB_Base {
    sender: string,
}
export interface LAAB_RegisterVendingLimiterCoinAccount  extends LAAB_Base {
    sender: string,
    vendingLimiter: boolean,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_ShowVendingLimiterCoinBalance  extends LAAB_Base {
    sender: string,
}
export interface LAAB_CoinTransfer extends LAAB_Base {
    sender: string,
    receiver: string,
    amount: number,
    description: string,
    coin_list_id: string,
    coin_code: string,
    limitBlock: number
}






// machine wallet
export interface LAAB_FindMachineWallet  extends LAAB_Base {
    sender: string,
    vendingid: string,
}
export interface LAAB_RegisterMachineWallet  extends LAAB_Base {
    sender: string,
    vendingid: string,
    limitBlock: number,
    role: string,
}
export interface LAAB_ShowMachineWalletBalance  extends LAAB_Base {
    sender: string,
    vendingid: string,
}
export interface LAAB_FindMachineCoinWallet  extends LAAB_Base {
    sender: string,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_RegisterMachineCoinWallet  extends LAAB_Base {
    sender: string,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_ShowMachineCoinWalletBalance  extends LAAB_Base {
    sender: string,
}
export interface LAAB_ShowMachineCoinWalletByGroup  extends LAAB_Base {
    sender: string,
    coinListId?: string,
    coinCode?: string,
    coin_group: Array<any>,
}



// machine limiter
// machine wallet
export interface LAAB_FindMachineLimiter  extends LAAB_Base {
    sender: string,
    vendingid: string,
}
export interface LAAB_RegisterMachineLimiter  extends LAAB_Base {
    sender: string,
    vendingid: string,
    limitBlock: number,
    role: string,
}
export interface LAAB_ShowMachineLimiterBalance  extends LAAB_Base {
    sender: string,
    vendingid: string,
}
export interface LAAB_FindMachineCoinLimiter  extends LAAB_Base {
    sender: string,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_RegisterMachineCoinLimiter  extends LAAB_Base {
    sender: string,
    coin_code: string,
    coin_list_id: string,
}
export interface LAAB_ShowMachineCoinLimiterBalance  extends LAAB_Base {
    sender: string,
}
export interface LAAB_ShowMachineCoinLimiterByGroup  extends LAAB_Base {
    sender: string,
    coinListId?: string,
    coinCode?: string,
    coin_group: Array<any>,
}
