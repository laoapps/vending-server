export interface IGPSLocation {
    lat: number;
    lng: number;
    alt: number;
    gpsTime: string;
    serverTime: string;
}
export interface IBase {
    id?: number;
    uuid?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    // deletedAt?:Date;
}
export interface IBlockChain {
    hashP: string;
    hashM: string;
}

export enum ERiderAccepted {
    none = 'none',
    true = 'true',
    false = 'false'
}
