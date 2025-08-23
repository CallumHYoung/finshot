export declare class Database {
    private db;
    private dbPath;
    constructor(dbPath?: string);
    connect(): Promise<void>;
    initializeSchema(): Promise<void>;
    run(sql: string, params?: any[]): Promise<{
        lastID: number;
        changes: number;
    }>;
    get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
    all<T = any>(sql: string, params?: any[]): Promise<T[]>;
    close(): Promise<void>;
}
export declare const database: Database;
//# sourceMappingURL=connection.d.ts.map