export interface IControlMenu {
    
    // ***** LAAB *****
    LAAB_MenuCashIn: boolean,
    LAAB_MenuCashOut: {
        LAABAccount: boolean,
        LAABEPIN: boolean
    }





    // ***** MMoney *****
    MMoney_MenuCashOut: {
        MMoneyAccount: boolean
    },
    MMoney_MenuIOSAndroidQRLink: boolean,






    // ***** Default *****
    Vending_MenuTicket: boolean,
    Vending_MenuCashOut: boolean,
    Vending_MenuWhatsapp: boolean,
    Vending_MenuHowTo: boolean,
    Vending_MenuTemperature: boolean,

}

// export interface IMenu_Tab1 {
//     MENU_Ticket: boolean,
//     MENU_LAABCashIn: boolean,
//     MENU_CashOut: boolean,
//     MENU_Whatsapp: boolean,
//     MENU_HowT
// }