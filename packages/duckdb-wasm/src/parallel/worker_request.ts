import { CSVInsertOptions, JSONInsertOptions, ArrowInsertOptions } from '../bindings/insert_options';
import { LogEntryVariant } from '../log';
import { ScriptTokens } from '../bindings/tokens';
import { FileStatistics } from '../bindings/file_stats';
import { DuckDBConfig } from '../bindings/config';
import { WebFile } from '../bindings/web_file';
import { InstantiationProgress } from '../bindings/progress';
import { DuckDBDataProtocol } from '../bindings';

export type ConnectionID = number;
export type StatementID = number;

export enum WorkerRequestType {
    CANCEL_PENDING_QUERY = 'CANCEL_PENDING_QUERY',
    CLOSE_PREPARED = 'CLOSE_PREPARED',
    COLLECT_FILE_STATISTICS = 'COLLECT_FILE_STATISTICS',
    CONNECT = 'CONNECT',
    COPY_FILE_TO_BUFFER = 'COPY_FILE_TO_BUFFER',
    COPY_FILE_TO_PATH = 'COPY_FILE_TO_PATH',
    CREATE_PREPARED = 'CREATE_PREPARED',
    DISCONNECT = 'DISCONNECT',
    DROP_FILE = 'DROP_FILE',
    DROP_FILES = 'DROP_FILES',
    CLOSE_FILE = 'CLOSE_FILE',
    EXPORT_FILE_STATISTICS = 'EXPORT_FILE_STATISTICS',
    FETCH_QUERY_RESULTS = 'FETCH_QUERY_RESULTS',
    FLUSH_FILES = 'FLUSH_FILES',
    GET_FEATURE_FLAGS = 'GET_FEATURE_FLAGS',
    GET_TABLE_NAMES = 'GET_TABLE_NAMES',
    GET_VERSION = 'GET_VERSION',
    GLOB_FILE_INFOS = 'GLOB_FILE_INFOS',
    INSERT_ARROW_FROM_IPC_STREAM = 'INSERT_ARROW_FROM_IPC_STREAM',
    INSERT_CSV_FROM_PATH = 'IMPORT_CSV_FROM_PATH',
    INSERT_JSON_FROM_PATH = 'IMPORT_JSON_FROM_PATH',
    INSTANTIATE = 'INSTANTIATE',
    OPEN = 'OPEN',
    PING = 'PING',
    POLL_PENDING_QUERY = 'POLL_PENDING_QUERY',
    REGISTER_FILE_BUFFER = 'REGISTER_FILE_BUFFER',
    REGISTER_FILE_HANDLE = 'REGISTER_FILE_HANDLE',
    REGISTER_FILE_URL = 'REGISTER_FILE_URL',
    RESET = 'RESET',
    RUN_PREPARED = 'RUN_PREPARED',
    RUN_QUERY = 'RUN_QUERY',
    SEND_PREPARED = 'SEND_PREPARED',
    START_PENDING_QUERY = 'START_PENDING_QUERY',
    TOKENIZE = 'TOKENIZE',
    INGEST_GET_SCHEMA = 'INGEST_GET_SCHEMA',
}

export enum WorkerResponseType {
    CONNECTION_INFO = 'CONNECTION_INFO',
    ERROR = 'ERROR',
    FEATURE_FLAGS = 'FEATURE_FLAGS',
    FILE_BUFFER = 'FILE_BUFFER',
    FILE_INFOS = 'FILE_INFOS',
    FILE_SIZE = 'FILE_SIZE',
    FILE_STATISTICS = 'FILE_STATISTICS',
    INSTANTIATE_PROGRESS = 'INSTANTIATE_PROGRESS',
    LOG = 'LOG',
    OK = 'OK',
    PREPARED_STATEMENT_ID = 'PREPARED_STATEMENT_ID',
    QUERY_PLAN = 'QUERY_PLAN',
    QUERY_RESULT = 'QUERY_RESULT',
    QUERY_RESULT_CHUNK = 'QUERY_RESULT_CHUNK',
    QUERY_RESULT_HEADER = 'QUERY_RESULT_HEADER',
    QUERY_RESULT_HEADER_OR_NULL = 'QUERY_RESULT_HEADER_OR_NULL',
    REGISTERED_FILE = 'REGISTERED_FILE',
    SCRIPT_TOKENS = 'SCRIPT_TOKENS',
    SUCCESS = 'SUCCESS',
    TABLE_NAMES = 'TABLE_NAMES',
    VERSION_STRING = 'VERSION_STRING',
    INGEST_SCHEMA = 'INGEST_SCHEMA',
}

export type WorkerRequest<T, P> = {
    readonly messageId: number;
    readonly type: T;
    readonly data: P;
};

export type WorkerResponse<T, P> = {
    readonly messageId: number;
    readonly requestId: number;
    readonly type: T;
    readonly data: P;
};

export type WorkerTaskReturnType<T extends WorkerTaskVariant> = T extends WorkerTask<any, any, infer P> ? P : never;

export class WorkerTask<T, D, P> {
    readonly type: T;
    readonly data: D;
    promise: Promise<P>;
    promiseResolver: (value: P | PromiseLike<P>) => void = () => {};
    promiseRejecter: (value: any) => void = () => {};

    constructor(type: T, data: D) {
        this.type = type;
        this.data = data;
        this.promise = new Promise<P>(
            (resolve: (value: P | PromiseLike<P>) => void, reject: (reason?: void) => void) => {
                this.promiseResolver = resolve;
                this.promiseRejecter = reject;
            },
        );
    }
}

type ExtractWorkerRequestVariant<T> = T extends WorkerTask<infer TaskType, infer DataType, any>
    ? WorkerRequest<TaskType, DataType>
    : never;
export type WorkerRequestVariant = ExtractWorkerRequestVariant<WorkerTaskVariant>;

export type WorkerResponseTypeVariant = WorkerResponseVariant['type'];
export type WorkerResponseDataType<
    ResponseType extends WorkerResponseTypeVariant,
    Variant = WorkerResponseVariant,
> = Variant extends WorkerResponse<ResponseType, infer DataType> ? DataType : never;

export type WorkerResponseVariant =
    | WorkerResponse<WorkerResponseType.CONNECTION_INFO, number>
    | WorkerResponse<WorkerResponseType.ERROR, any>
    | WorkerResponse<WorkerResponseType.FEATURE_FLAGS, number>
    | WorkerResponse<WorkerResponseType.FILE_BUFFER, Uint8Array>
    | WorkerResponse<WorkerResponseType.FILE_INFOS, WebFile[]>
    | WorkerResponse<WorkerResponseType.FILE_SIZE, number>
    | WorkerResponse<WorkerResponseType.FILE_STATISTICS, FileStatistics>
    | WorkerResponse<WorkerResponseType.INSTANTIATE_PROGRESS, InstantiationProgress>
    | WorkerResponse<WorkerResponseType.LOG, LogEntryVariant>
    | WorkerResponse<WorkerResponseType.OK, null>
    | WorkerResponse<WorkerResponseType.PREPARED_STATEMENT_ID, number>
    | WorkerResponse<WorkerResponseType.QUERY_PLAN, Uint8Array>
    | WorkerResponse<WorkerResponseType.QUERY_RESULT, Uint8Array>
    | WorkerResponse<WorkerResponseType.QUERY_RESULT_CHUNK, Uint8Array>
    | WorkerResponse<WorkerResponseType.QUERY_RESULT_HEADER, Uint8Array>
    | WorkerResponse<WorkerResponseType.QUERY_RESULT_HEADER_OR_NULL, Uint8Array | null>
    | WorkerResponse<WorkerResponseType.SCRIPT_TOKENS, ScriptTokens>
    | WorkerResponse<WorkerResponseType.SUCCESS, boolean>
    | WorkerResponse<WorkerResponseType.TABLE_NAMES, string[]>
    | WorkerResponse<WorkerResponseType.INGEST_SCHEMA, string>
    | WorkerResponse<WorkerResponseType.VERSION_STRING, string>;

export type WorkerTaskVariant =
    | WorkerTask<WorkerRequestType.COLLECT_FILE_STATISTICS, [string, boolean], null>
    | WorkerTask<WorkerRequestType.CLOSE_PREPARED, [ConnectionID, StatementID], null>
    | WorkerTask<WorkerRequestType.CONNECT, null, ConnectionID>
    | WorkerTask<WorkerRequestType.COPY_FILE_TO_BUFFER, string, Uint8Array>
    | WorkerTask<WorkerRequestType.COPY_FILE_TO_PATH, [string, string], null>
    | WorkerTask<WorkerRequestType.CREATE_PREPARED, [ConnectionID, string], number>
    | WorkerTask<WorkerRequestType.DISCONNECT, ConnectionID, null>
    | WorkerTask<WorkerRequestType.DROP_FILE, string, null>
    | WorkerTask<WorkerRequestType.DROP_FILES, null, null>
    | WorkerTask<WorkerRequestType.CLOSE_FILE, string, boolean>
    | WorkerTask<WorkerRequestType.EXPORT_FILE_STATISTICS, string, FileStatistics>
    | WorkerTask<WorkerRequestType.FETCH_QUERY_RESULTS, ConnectionID, Uint8Array>
    | WorkerTask<WorkerRequestType.FLUSH_FILES, null, null>
    | WorkerTask<WorkerRequestType.GET_FEATURE_FLAGS, null, number>
    | WorkerTask<WorkerRequestType.GET_TABLE_NAMES, [number, string], string[]>
    | WorkerTask<WorkerRequestType.INGEST_GET_SCHEMA, [number, string, string], string>
    | WorkerTask<WorkerRequestType.GET_VERSION, null, string>
    | WorkerTask<
          WorkerRequestType.INSERT_ARROW_FROM_IPC_STREAM,
          [number, Uint8Array, ArrowInsertOptions | undefined],
          null
      >
    | WorkerTask<WorkerRequestType.INSERT_CSV_FROM_PATH, [number, string, CSVInsertOptions], null>
    | WorkerTask<WorkerRequestType.INSERT_JSON_FROM_PATH, [number, string, JSONInsertOptions], null>
    | WorkerTask<WorkerRequestType.INSTANTIATE, [string, string | null], null>
    | WorkerTask<WorkerRequestType.OPEN, DuckDBConfig, null>
    | WorkerTask<WorkerRequestType.PING, null, null>
    | WorkerTask<WorkerRequestType.REGISTER_FILE_BUFFER, [string, Uint8Array], null>
    | WorkerTask<WorkerRequestType.REGISTER_FILE_HANDLE, [string, any, DuckDBDataProtocol, boolean], null>
    | WorkerTask<WorkerRequestType.REGISTER_FILE_URL, [string, string, DuckDBDataProtocol, boolean], null>
    | WorkerTask<WorkerRequestType.GLOB_FILE_INFOS, string, WebFile[]>
    | WorkerTask<WorkerRequestType.RESET, null, null>
    | WorkerTask<WorkerRequestType.RUN_PREPARED, [number, number, any[]], Uint8Array>
    | WorkerTask<WorkerRequestType.RUN_QUERY, [ConnectionID, string], Uint8Array>
    | WorkerTask<WorkerRequestType.SEND_PREPARED, [number, number, any[]], Uint8Array>
    | WorkerTask<WorkerRequestType.START_PENDING_QUERY, [ConnectionID, string], Uint8Array | null>
    | WorkerTask<WorkerRequestType.POLL_PENDING_QUERY, ConnectionID, Uint8Array | null>
    | WorkerTask<WorkerRequestType.CANCEL_PENDING_QUERY, ConnectionID, boolean>
    | WorkerTask<WorkerRequestType.TOKENIZE, string, ScriptTokens>;
