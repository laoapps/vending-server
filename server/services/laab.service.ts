export const LAAB_pathLogin: string = 'http://localhost:30000/api/v1/laoapps_ewallet/user/login';
export const LAAB_pathCounterIssued: string = 'http://localhost:30000/api/v1/laoapps_ewallet/issuer_client/issue';

export enum IENMessage {
    invalidAmount = 'invalid amount',
    parametersEmpty = 'parameters empty',
    success = 'success'
}