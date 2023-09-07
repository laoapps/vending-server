export enum IENMessage {
    invalidSellDetail = 'invalid sell detail',
    retryPayYourOrderFail5TimesYourOrderWasReset = 'retry pay your order fail 5 times your order was reset',
    generateMMoneyQRCodeFail = 'generate MMoney QRCode fail',
    invalidAmount = 'invalid amount',
    invalidSelectionGameMenu = 'invalid selection game menu',
    notFoundYourMMoneyAccount = 'Not found your MMoney account',
    saveSaleFail = 'save sale fail',
    endShouldMoreThenStart = 'end should more then start',
    startShouldLesterThenEnd = 'start should lester then end',
    cashoutMMoneySuccess = 'cash out MMoney success',
    testMotor = 'test motor',
    testMotorSuccess = 'test motors success',
    notFoundFile = 'not found file',
    vendingSaleListEmpty = 'vending sale list empty',
    loadVendingSaleListFail = 'load vending sale list fail',
    phonePaymentSuccess = 'phone payment success',
    minimumOfAmountIs1000 = 'minimum of amount is 1000',
    invalidCustomAmount = 'invalid custom amount',
    balanceIsNotEnought = 'balance is not enought',
    invalidSelectionTopupServiceMenu = 'invalid selection topup service menu',
    invalidPhonenumber = 'invalid phone number',
    thereIsNotBalance = 'there is not balance',
    cashoutToAnotherLAABAccountSuccess = 'cash out to another LAAB account success',
    laabCashinSuccess = 'LAAB cash in success',
    timeupPleaseGenerateAgain = 'time up please generate again',
    notFoundAnySaveSMC = 'not found any save smc',
    thisSmcHaveAlreadyUsedOrThatOneWasDelete = 'this smart contract already used or that one was delete',
    notEnoughtCashBalance = 'not enought balance',
    success = 'success',
    parametersEmpty = 'parameters empty'
}

export enum ITabVendingSegement {
    vending = 'vending',
    hangmistore = 'hangmistore',
    hangmifood = 'hangmifood',
    topupandservices = 'topupandservices'
}
export enum IWebviewTabs  {
    vending = 'vending',
    hangmistore = 'hangmistore',
    hangmifood = 'hangmifood',
    topupandservices = 'topupandservices'
}