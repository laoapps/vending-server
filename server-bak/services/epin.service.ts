import { decimalToHex } from "./laab.service";

export function genModel(coincode: string) {
    // decimal
   let codeCoin = coincode;
    
//    console.log(`gen1 -->`, codeCoin);
    // hex all values of coin
   codeCoin = decimalToHex(codeCoin, 4);
//    console.log(`gen2 -->`, codeCoin);

   const databaseValue = codeCoin; // example = 3
   const clientValue = decimalToHex(databaseValue, 4); // example = 0003

    return { databaseValue: databaseValue, clientValue: clientValue };
  }
export function genCode(amount: number = 1, clientValue: string) {
    let codeList: Array<any> = [];
    let code: string = '';
    for(let i = 0; i < amount; i++) {
        code = '';
        for(let i = 0; i < 15; i++) {
            code += Math.floor(Math.random() * 9);
        }
        if (codeList.includes(code)) {
            i--;
            continue;
        }
        const model = 't' + clientValue + code;
        codeList.push(model);
    }
    return codeList;
}
export function genQRCode(amount: number = 1, clientValue: string) {
    let qrcodeList: Array<any> = [];
    let qrcode: string = '';
    for(let i = 0; i < amount; i++) {
        qrcode = '';
        for(let i = 0; i < 20; i++) {
        qrcode += Math.floor(Math.random() * 9);
        }
        if (qrcodeList.includes(qrcode)) {
        i--;
        continue;
        }
        const model = 't' + clientValue + qrcode;
        qrcodeList.push(model);
    }
    return qrcodeList;
}