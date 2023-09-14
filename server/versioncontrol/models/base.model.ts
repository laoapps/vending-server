
export interface IBase {
    id?: number,
    uuid?: string,
    isActive?: boolean
}
export interface IVendingVersion extends IBase {
    file: {
        url: string,
        filename: string,
        filesize: string
    },
    version: string,
    readme: {
        commit_version: string,
        title: string,
        subtitle: string,
        section: Array<string>,
        description: Array<string>,
        hightlight: Array<string>,
    }
}
export interface ICreateVendingVersion {
    file: {
        url: string,
        filename: string,
        filesize: string
    },
    readme: {
        commit_version: string,
        title: string,
        subtitle: string,
        section: Array<string>,
        description: Array<string>,
        hightlight: Array<string>,
    }
}
