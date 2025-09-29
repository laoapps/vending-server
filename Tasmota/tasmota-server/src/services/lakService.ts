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
export function generateQR(orderID: number, value: number, token: string, fromvending: boolean=false): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const data = { orderID, path: 'orders/pay', txnAmount: value }
      let vending: any = null
      if (fromvending == true) {
        vending = 'true'
      }
      const res = await axios.post("https://laabx-api.laoapps.com/api/v1/laab/genMmoneyQR_tasmota", data, { headers: { 'Content-Type': 'application/json', 'token': token, 'vending': vending } });
      console.log('generateQR', res.data);
      if (res.data.status != 1) return reject({ errr: new Error(res.data) });
      resolve(res.data.data);
    } catch (error) {
      console.log('generateQRError', error);
      resolve(null)
    }
  });
}