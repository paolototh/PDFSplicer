//Using the better-sqlite3 library for database management
//Store metadata, file references, history
//Use the Node.js fs.statSync method to get file info
//Use uuid library to generate unique IDs for each file entry

import Database from "better-sqlite3";
import path from "path";
import { StorageService } from "./StorageService.js";
import { v4 as uuidv4 } from "uuid";

// ts requires the export keyword for this class to be available outside this file

export class DatabaseService {
    
    //PLACEHOLDER
    private database: Database;
    
    //PLACEHOLDER
    constructor(StorageService: StorageService) {
    //I am making the constructor parameter the path to the current workspate
    //From there i can import files, take metadata and store it in the database
        const dbPath = StorageService.getDatabasePath;
        this.database = new Database(dbPath);
    }
    
    //PLACEHOLDER
    initializeDatabase(workspaceService: StorageService): void {
        this.database.exec(`
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                originalName TEXT NOT NULL,
                internalPath TEXT NOT NULL,
                lastModified INTEGER NOT NULL,
                file_size INTEGER NOT NULL,
                date_added TEXT NOT NULL
            );
        `);
    }

    async addToDatabase(): Promise<void> {

    }
}