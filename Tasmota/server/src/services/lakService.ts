import axios from 'axios';

export function getLAKUserBalance(token: string): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    const res = await axios.post(process.env.LAABX_LAK_URL + 'laab/checkbalance', {}, { headers: { 'Content-Type': 'application/json', 'token': token, 'coin': 'Lak' } });
    console.log('getLAKUserBalance', res.data, token);
    if (res.data.status != 1) resolve(null)
    resolve(res.data.data.value)
  })
}
export function updateLAKUserBalance(data: any, token: string): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    try {
      // data = {
      //   receiver: um_re.phoneNumber.split('+85620')[1],
      //   amount: r.qty,
      //   description: {
      //     order: r
      //   }
      // }
      const res = await axios.post(process.env.LAABX_LAK_URL + 'laab/transferLaab', data, { headers: { 'Content-Type': 'application/json', 'token': token, 'coin': 'Lak' } });
      console.log('updateLAKUserBalance', res.data, token);
      if (res.data.status != 1) return reject({ errr: new Error(res.data) });
      resolve(res.data.data);
    } catch (error) {
      console.log('updateLAKUserBalanceERROR', error);
      resolve(null)
    }
  });
}
export function updateLAXUserBalance(data: any, token: string): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const res = await axios.post(process.env.LAABX_LAX_URL + 'laab/transferLaab', data, { headers: { 'Content-Type': 'application/json', 'token': token, 'coin': 'Lax' } });
      console.log('updateLAXUserBalance', res.data, token);
      if (res.data.status != 1) return reject({ errr: new Error(res.data) });
      resolve(res.data.data);
    } catch (error) {
      console.log('updateLAXUserBalanceERROR', error);
      resolve(null)
    }
  });
}
export function generateQR(data: any): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const res = await axios.post(process.env.LAABX_LAK_URL + 'laab/generateQR', data, { headers: { 'Content-Type': 'application/json' } });
      console.log('generateQR', res.data);
      if (res.data.status != 1) return reject({ errr: new Error(res.data) });
      resolve(res.data.data);
    } catch (error) {
      console.log('generateQRError', error);
      resolve(null)
    }
  });
}

export interface ILaoQRGenerateQRRes {
    timestamp: Date,
    success: boolean,
    message: string,
    transactionId: string,
    data: any
}

export function generateBillLaoQRPro(value: number, channel: string, mechantId: string, ownerPhone: string) {
  return new Promise<ILaoQRGenerateQRRes>((resolve, reject) => {
    // generate QR from MMoney
    const qr = {
      "requestId": "",
      "merchantId": mechantId, //DBK :25ATP48M8RD1MKJ4W8FGLGXYC
      "txnAmount": value,
      // "billNumber": "LQR123213131280004925277",
      "terminalId": ownerPhone, //Device Number ເບີຄົນຮັບເງິນ
      "terminalLabel": "laabxserver", // Device Name
      "mobileNo": ownerPhone, // CashIn to Wallet Number (Merchant)  ເບີຄົນຮັບເງິນ
      "channel": `VENDING_` + channel, // Vending Machine 
      "owner": "LAABX", // Merchant Name  LAABX
      // "callbackurl": "https://tvending.khamvong.com"
      "callbackurl": "https://vending-service-api5.laoapps.com"
    }
    // console.log("LAOQR", qr);

    axios
      .post<ILaoQRGenerateQRRes>(
        "https://laabx-api.laoapps.com/api/v1/laab/genmmoneyqr_vending",
        qr,
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then((rx) => {
        console.log("generateBillLaoQRPro", rx.data);
        if (rx.status) {
          resolve(rx.data.data as ILaoQRGenerateQRRes);
        } else {
          reject(new Error(rx.statusText));
        }
      })
      .catch((e) => {
        reject(e);
      });

  });
}