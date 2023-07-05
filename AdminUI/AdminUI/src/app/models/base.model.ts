export enum IENMessage {
    writeFileFailAndCancelwriteFileSuccess = 'write fle fail and cancel write file success',
    cancelAndWriteFileFail = 'cancel and write file fail',
    addMachineError = 'add machine error',
    writeFileError = 'write file error',
    addMachineFail = 'add machine fail',
    writeFileFail = 'write file fail',
    thisEPINHasAlreadyCashedOut = 'this EPIN has already cashed out',
    invalidTime = 'invalid time',
    pleaseEnterPhonenumber = 'please enter phone number',
    notFoundAnyDataList = 'not found any data list',
    thisCQRIsNotVendingCoin = 'this CQR is not vending coin',
    notFoundYourVendingWalletCoin = 'not found your vending wallet coin',
    notFoundYourVendingWallet = 'not found your vending wallet',
    invalidVerifyMode = 'invalid verify mode',
    notFoundYourVendingLimiterCoin = 'not found your vending limiter coin',
    notFoundYourVendingLimiter = 'not found your vending limiter',
    notFoundYourMerchantCoin = 'not found your merchant coin',
    notFoundYourMerchant = 'not found your merchant',
    pleaseLimitAmount = 'please limit amount',
    reduceCardBalanceFail = 'reduce card balance fail',
    youHaveNoCardUsingNow= 'you have not using card now',
    notFoundVendingLimiterEntityInLaab = 'not found vending limiter entity in laab',
    notFoundVendingLimiterEntity = 'not found vending limiter entity',
    notFoundVendingLimiterEntityInSystem = 'not found vending limiter entity system',
    notFoundMerchantEntityInSystem = 'not found merchant in system',
    notFoundMerchantEntityInLaab = 'not found merchant in laab',
    yourBalanceIsNotEnought = 'your balance is not enough',
    youCanNotTransferToYourown = 'you can not transfer to your own',
    notFoundMachineLimiterEntity = 'not found machine limiter entity',
    notFoundMachineWalletEntity = 'not found machine wallet entity',
    notFoundAnyCoinParameters = 'not found any coin parmaters',
    pexCoinListEntityHasNotCreatedYet = '',
    pexSenderCoinEntityHasNotCreatedYet = 'pex sender coin entity has not created yet',
    notFoundVendingCoin = 'not found vending coin',
    registerMachineLimiterSuccess = 'register machine limiter success',
    registerMachineWalletSuccess = 'register machine wallet success',
    notFoundVendingID = 'not found vending id',
    registerMerchantAccountSuccess = 'register merchant account success',
    senderWalletEntityHasNotCreatedYet = 'sender wallet entity has not created yet',
    notFoundMerchantEntity = 'not found merchant entity',
    phonenumberAndPasswordIsRequired = 'phone number and password is required!',
    parametersEmpty = 'parameters empty',
    success = 'success'
}

export enum IVendingRoles {
    merchant = 'merchant',
    vendingLimiter = 'vendingLimiter',
    vendingWallet = 'vendingWallet'
}

export enum ICurrentCard {
    merchantCoinCard = 'merchant coin card',
    vendingLimtierCoinCard = 'vending limiter coin card'
}