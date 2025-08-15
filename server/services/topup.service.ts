import { Sequelize, DataTypes } from 'sequelize';
import { createClient } from 'redis';
import axios from 'axios';
import { NextFunction, Response, Request } from 'express';
import { OwnerEntity, UserEntity } from '../models/ topup.model';
import { dbConnection as sequelize  } from '../entities';



export const redisClient = createClient({ url: process.env.REDIS_HOST|| 'redis://vending-redis-service:6379' });
redisClient.connect().catch(console.error);

export function initialize() {
    if (!sequelize) {
    throw new Error('Database connection not initialized');
  }
    OwnerEntity.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        token: { type: DataTypes.STRING, allowNull: false }
    }, { sequelize, modelName: 'Owner' });

    UserEntity.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.STRING, allowNull: false, unique: true },
        name: { type: DataTypes.STRING, allowNull: false },
        phoneNumber: { type: DataTypes.STRING, allowNull: false },
        token: { type: DataTypes.STRING, allowNull: false, unique: true },
        ownerUuid: { type: DataTypes.STRING, allowNull: false },
        balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
    }, { sequelize, modelName: 'User' });



    // Sync all models before loading settings
    sequelize.sync({ force: false }).then(() => {
        // loadSettings();
    }).catch(err => {
        console.error('Error syncing database:', err);
    });

    return { OwnerEntity, UserEntity };
}


export async function findRealDB(token: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {

        if (token) {
            const data = {
                method: 'getUserUuid',
                object: 'authorize',
                data: {
                    token,
                    service: process.env.SERVICE_NAME || '',
                },
            };

            axios
                .post(process.env.USERMANAGER_HOST || '', data, {
                    headers: {
                        backendkey: process.env.SERVICE_BACKEND_KEY || '',
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
export function validate_server_key(key: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // console.log(token);

        if (key) {
            const data = {
                method: "validate_server_key",
                object: "authorize",
                data: {
                    key,
                }
            }

            // resolve('3575e2d5-8268-4dae-922e-24c73ce03372');

            axios.post(process.env.USERMANAGER_HOST + '', data, {
                headers: {
                    backendkey: process.env.SERVICE_BACKEND_KEY + '',
                    service: process.env.SERVICE_NAME + '',
                }
            }).then(r => {
                const d = r.data;
                // console.log('d', d);
                if (d) {
                    resolve(d.data[0]);
                    console.log('validate_server_key:', d.data);
                } else {
                    resolve('')
                }
            }).catch(e => { reject(e) });
        }
        else resolve('')

    })

}

// validate client
export async function clientMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.body.token) {
        res.status(400).json({ error: 'Token is required' });
        return;
    }
    let uuid = await findRealDB(req.body.token);
    res.locals['client'];
    try {

        if (!uuid) {
            res.status(401).json({ error: 'Invalid uuid client' });
        } else {
            res.locals.client = { uuid };
            next();
        }

    } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
}

// validate owner
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.body.ownertoken) {
        res.status(400).json({ error: 'Token is required' });
        return;
    }
    let uuid = await findRealDB(req.body.ownertoken);
    try {
        if (!uuid) {
            res.status(401).json({ error: 'Invalid uuid owner' });
        } else {
            res.locals.user = { uuid };
            next();
        }

    } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
}

// validate admin
export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.body.adminToken) {
        res.status(400).json({ error: 'Token is required' });
        return;
    }
    let uuid = await findRealDB(req.body.adminToken);
    const server_key = await validate_server_key(req.body.key);
    try {
        if (!uuid || !server_key || req.body.key !== process.env.SERVICE_BACKEND_KEY) {
            res.status(401).json({ error: 'Invalid uuid admin' });

        } else {
            res.locals.admin = { uuid };
            next();
        }

    } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
}

/// Admin info from LAABX
export async function adminTopup(userUuid: string, amount: number) {
    // admin info ask to pay to specific account ( admin account) LAK or LaoQR
    // return topup string 
    // name of admin 
    // BACKEND_NAME
    // send description
}
export async function getUserBalance(userUuid: string): Promise<number> {
    // get user balance from redis or database
    // get from LAK
    const user = await UserEntity.findOne({ where: { token: userUuid } });
    if (user) {
        return parseFloat(user.balance.toString());
    }
    return 0;
}
export async function updateUserBalance(userUuid: string, amount: number): Promise<void> {
    // update user balance in redis or database
    const user = await UserEntity.findOne({ where: { token: userUuid } });
    if (user) {
        user.balance = parseFloat(user.balance.toString()) + amount;
        await user.save();
        await redisClient.set(`user:${userUuid}:balance`, user.balance.toString());
    } else {
        throw new Error('User not found');
    }
}
export async function getLAKUserBalance(userUuid: string): Promise<number> {
    // get user balance from redis or database
    const user = await UserEntity.findOne({ where: { token: userUuid } });
    if (user) {
        return parseFloat(user.balance.toString());
    }
    return 0;
}
export async function updateLAKUserBalance(userUuid: string, amount: number): Promise<void> {
    // update user balance in redis or database
    // update to LAK
    const user = await UserEntity.findOne({ where: { token: userUuid } });
    if (user) {
        user.balance = parseFloat(user.balance.toString()) + amount;
        await user.save();
        await redisClient.set(`user:${userUuid}:balance`, user.balance.toString());
    } else {
        throw new Error('User not found');
    }
}

