import axios from 'axios';
export function notilaabx_smartcb(data:any, token: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const res = await axios.post(process.env.NOTILAABX_URL + 'callback/notify_smartcb', data, { headers: { 'Content-Type': 'application/json', 'token': token }, timeout: 3000 });
            console.log('notilaabx_smartcb', res.data, token);
            if (res.data.status != 1) return resolve('');
            resolve(res.data.data);
        } catch (error) {
            console.log('notilaabx_smartcbERROR', error);
            resolve(null)
        }
    });
}