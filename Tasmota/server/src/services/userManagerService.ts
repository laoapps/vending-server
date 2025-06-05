import axios from 'axios';
import { env } from '../config/env';
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
                    if (d?.data?.data?.uuid) {
                        console.log('findRealDB:', d.data.data.uuid, 'Phone Number:', d.data.data.phoneNumber);
                        resolve(d.data.data.phoneNumber);
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