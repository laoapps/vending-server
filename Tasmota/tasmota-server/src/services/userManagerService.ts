import axios from 'axios';
import { env } from '../config/env';
import cryptojs from 'crypto-js';
console.log('ENV:', env);
export function findUuidByPhoneNumberOnUserManager(phoneNumber: string): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const validateParams: any = {
        object: 'authorize',
        method: 'findUuidByPhoneNumber',
        data: {
          service: env.SERVICE_NAME,
          phoneNumber,
        },
      };

      const validated = await axios.post(env.USERMANAGER_URL, validateParams, {
        headers: {
          'Content-Type': 'application/json',
          BackendKey: env.BACKEND_KEY,
          service: env.SERVICE_NAME,
        },
      });

      if (validated.data.status !== 1) return resolve('');
      resolve(validated.data.data[0]); // { uuid: string, phoneNumber: string }
    } catch (error) {
      reject(error);
    }
  });
}

export async function findPhoneNumberByUuid(uuid: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {

        if (uuid) {
            const data = {
                method: 'findPhoneNumberByUuid',
                object: 'authorize',
                data: {
                    uuid,
                    service:env.SERVICE_NAME || '',
                },
            };

            axios
                .post(process.env.USERMANAGER_URL || '', data, {
                    headers: {
                        backendkey:env.BACKEND_KEY || '',
                    },
                })
                .then((r) => {
                    const d = r.data;
                    console.log('findPhoneNumberByUuid:', d);
                    if (d?.data[0]?.uuid) {
                        console.log('findPhoneNumberByUuid:', d.data[0]?.uuid, 'Phone Number:', d.data[0]?.phoneNumber);
                        resolve(d.data[0]?.phoneNumber);
                    } else {
                        resolve('');
                    }
                })
                .catch((e) => reject(e));
        } else {
            resolve('');
        }
    });
}
export async function findRealDB(token: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {

        if (token) {
            const data = {
                method: 'getUserUuid',
                object: 'authorize',
                data: {
                    token,
                    service:env.SERVICE_NAME || '',
                },
            };

            axios
                .post(process.env.USERMANAGER_URL || '', data, {
                    headers: {
                        backendkey:env.BACKEND_KEY || '',
                    },
                })
                .then((r) => {
                    const d = r.data;
                    console.log('findRealDB:', d);
                    if (d?.data?.data?.uuid) {
                        console.log('findRealDB:', d.data.data.uuid);
                        resolve(d.data.data.uuid);
                    } else {
                        resolve('');
                    }
                })
                .catch((e) => reject(e));
        } else {
            resolve('');
        }
    });
}


// export async function validateHMVending(machineId: string, otp: string): Promise<string> {
export async function validateHMVending(token: string): Promise<string> {
//   if (!machineId) return '';
  if (!token) return '';

//   const token = cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex);
  const data = { token };
  const hmVendingUrl = process.env.hmVendingUrl;

  if (!hmVendingUrl) {
    console.error('hmVendingUrl is not defined');
    return '';
  }

  try {
    // const response = await axios.post(hmVendingUrl, data, { timeout: 10000 }); // 10s timeout
    // https://vending-service-api5.laoapps.com/zdm8/validateHMVending
    const response = await axios.post(hmVendingUrl, data, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
    });
    const d = response.data.data;

    if (d?.ownerUuid) {
      console.log('ownerUuid:', d.ownerUuid);
      return d.ownerUuid;
    } else {
      return '';
    }
  } catch (err: any) {
    if (err.response) {
      // Server responded with a status code outside 2xx
      console.error('Response error:', err.response.status, err.response.data);
    } else if (err.request) {
      // No response received
      console.error('No response received:', err.request);
    } else {
      console.error('Request setup error:', err.message);
    }
    return '';
  }
}


export async function WS_HMVending(token: string,order:any): Promise<string> {
  if (!token) return '';
  const data = {
    machinetoken:token,data:{callback:'true',order}
};
  const hmVendingWSUrl = process.env.hmVendingWSUrl;
  if (!hmVendingWSUrl) {
    console.error('hmVendingWSUrl is not defined');
    return '';
  }
  try {
    const response = await axios.post(hmVendingWSUrl, data, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
    });

    console.log('WS_HMVending',response);
    
    const d = response.data.data;
    // if (d?.ownerUuid) {
    //   console.log('ownerUuid:', d.ownerUuid);
    //   return d.ownerUuid;
    // } else {
    //   return '';
    // }
    return d
  } catch (err: any) {
    if (err.response) {
      console.error('Response error:', err.response.status, err.response.data);
    } else if (err.request) {
      console.error('No response received:', err.request);
    } else {
      console.error('Request setup error:', err.message);
    }
    return '';
  }
}

// export async function validateHMVending(machineId: string,otp:string): Promise<string> {
//     return new Promise<string>((resolve, reject) => {

//         if (machineId) {
           
//             const token =cryptojs
//       .SHA256(machineId + otp)
//       .toString(cryptojs.enc.Hex);
//        const data = {
//                 token
//             };
//             const hmVendingUrl = process.env.hmVendingUrl;
//             axios
//                 .post(hmVendingUrl || '', data, {})
//                 .then((r) => {
//                     const d = r.data;
//                     console.log('ownerUuid:', d);
//                     if (d.ownerUuid) {
//                         console.log('ownerUuid:', d.ownerUuid);
//                         resolve(d?.ownerUuid);
//                     } else {
//                         resolve('');
//                     }
//                 })
//                 .catch((e) => reject(e));
//         } else {
//             resolve('');
//         }
//     });
// }