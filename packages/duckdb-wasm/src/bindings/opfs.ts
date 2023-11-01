/// <reference types="wicg-file-system-access" />

export const defaultOPFSProtocol = 'opfs:'

/** The file handle for OPFS */
export interface OPFSFileHandle {
    /**
     * @example '/'
     * @example '/dir'
     */
    dirPath: string;
    dirHandle: FileSystemDirectoryHandle;
    fileName: string;

    file?: File;
    fileHandle?: FileSystemFileHandle;
    accessHandle?: FileSystemSyncAccessHandle;
}

function splitPath(path: string): string[] {
    const parts = path.split(/\/+/);
    const results: string[] = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '.' || part === '') continue;
        if (part === '..') results.pop();
        else results.push(part);
    }
    return results;
}

export class OPFSFileHandleGenerator {
    /** Keys in this map does not contain the leading '/' */
    private cachedDirHandles = new Map<string, FileSystemDirectoryHandle>();
    constructor(readonly root: FileSystemDirectoryHandle) {}
    async getDirHandle(path: string | string[], options: { create?: boolean }) {
        const parts = Array.isArray(path) ? path : splitPath(path);
        const cachedHandle = this.cachedDirHandles.get(parts.join('/'));
        if (cachedHandle) return cachedHandle;

        let ptr = this.root;
        let cacheKey = '';
        const create = options.create || false;
        for (const part of parts) {
            cacheKey = cacheKey ? `${cacheKey}/${part}` : part;
            try {
                ptr = await ptr.getDirectoryHandle(part, { create });
            } catch (error) {
                const msg = create ? `Could not create directory: ${cacheKey}` : `Directory not found: ${cacheKey}`;
                throw new Error(msg);
            }
            this.cachedDirHandles.set(cacheKey, ptr);
        }
        return ptr;
    }
    async create(path: string | string[], options: CreateOPFSFileHandleOptions): Promise<OPFSFileHandle> {
        const parts = Array.isArray(path) ? path : splitPath(path);
        if (parts.length < 1) throw new Error(`Invalid file path: ${path}`);
        const fileName = parts.pop()!;
        const dirHandle = await this.getDirHandle(parts, options);
        return createOPFSFileHandle(parts.join('/'), dirHandle, fileName, options);
    }
}

export type CreateOPFSFileHandleOptions = {
    create?: boolean;
    access?: boolean;
};
export async function createOPFSFileHandle(
    dirPath: string,
    dirHandle: FileSystemDirectoryHandle,
    fileName: string,
    options?: CreateOPFSFileHandleOptions,
): Promise<OPFSFileHandle> {
    dirPath = dirPath.replace(/\/$/, '');
    if (!dirPath) dirPath = '/';
    
    const mtx = dirPath.match(/([^/]*)$/);
    if (!mtx) throw new Error(`Invalid dirPath: "${dirPath}"`);
    if (mtx[1] !== dirHandle.name) throw new Error(`dirPath "${dirPath}" is not matched with "${dirHandle.name}"`);

    let file: File | undefined;
    let fileHandle: FileSystemFileHandle | undefined;
    let accessHandle: FileSystemSyncAccessHandle | undefined;

    const create = options?.create || false;
    const access = options?.access || false;
    if (create || access) {
        fileHandle = await dirHandle.getFileHandle(fileName, { create: create || false });
        file = await fileHandle.getFile();
    }
    if (access && fileHandle) accessHandle = await fileHandle.createSyncAccessHandle();
    return { dirPath, dirHandle, fileName, file, fileHandle, accessHandle };
}

export function assertOPFSHandle<P extends boolean>(
    context: string,
    fileName: string,
    handle: any,
    requireAccessHandle?: P,
): asserts handle is P extends true ? Required<OPFSFileHandle> : OPFSFileHandle {
    if (!handle) throw new Error(`No OPFS access handle registered with name: ${fileName}`);
    if (!handle.fileName) throw new Error(`Invalid file handle registered with name: ${fileName}`);
    if (!handle.accessHandle) {
        const errMsg = `Cannot perform ${context} on an file that hasn't been opened: "${fileName}"`;
        if (requireAccessHandle) throw new Error(errMsg);
        else console.warn(errMsg);
    }
}
