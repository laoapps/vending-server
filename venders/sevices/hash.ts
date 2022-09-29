// import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import EC from 'elliptic';
const ec = new EC.ec('secp256k1');
export class HashService {
    //TOUYA-RA
    // put 
    public static calculateHash(s: string) {
        return crypto.createHash('sha256').update(s).digest('hex');
    }
    // 
    public static verifySignature(hashTx: string, signature: string, publicKey: string) {
        try {
            const publickey = ec.keyFromPublic(publicKey, 'hex');
            return publickey.verify(hashTx, signature);
        } catch (error) {
            console.log(error)
            return null;
        }
    }
    public static sign(hashTx: string = '', privateKey: string) {
        try {
            const data = Buffer.from(hashTx, 'hex');
            const signature = ec.sign(data, Buffer.from(privateKey, 'hex'), 'base64');
            var derSign = signature.toDER('hex');
            return derSign;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    public static genPairKeysHex(): { publicKey: any, privateKey: any } {
        const keyp = ec.genKeyPair();
        return { publicKey: keyp.getPublic('hex'), privateKey: keyp.getPrivate('hex') }
    }
    public static keyPair={
        publicKey: '045e90911daa613989aab76e834e54c6e3db9f840447dbb3c67ef4323a852ee4a322e32b479d3513b6fd6d37f5f467df35c14d7149f1c570b082e18a2ccc8e6764',
        privateKey: '6db46c2659c80cea3d0a0b9b815fef60ba57bde271b5f2348e9c27f71fbbd269'
      }
    //TOUYA-RA
}

