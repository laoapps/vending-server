import axios from 'axios';
import { env } from '../config/env';

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