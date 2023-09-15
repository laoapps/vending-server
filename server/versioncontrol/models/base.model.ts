
export interface IBase {
    id?: number,
    uuid?: string,
    isActive?: boolean
}
export interface IVendingVersion extends IBase {
    commit_version: string,
    title: string,
    subtitle: string,
    file: {
        url: string,
        filename: string,
        filesize: string
    },
    version: string,
    readme: {
        section: Array<string>,
        description: Array<string>,
        hightlight: Array<string>,
    }
}
export interface ICreateVendingVersion extends IVendingVersion {}