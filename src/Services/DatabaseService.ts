//Using the better-sqlite3 library for database management
//Store metadata, file references, history
//Use the Node.js fs.statSync method to get file info
//Use uuid library to generate unique IDs for each file entry

import { app } from "electron";
import path from "path";
import Database from "better-sqlite3";
import { ProjectSchema, SourceMetadata, SinglePageAsset, Project, OutputMetadata } from "./ZodSchemas.js"

// ts requires the export keyword for this class to be available outside this file

export class DatabaseService {
    
    //PLACEHOLDER
    private database: Database.Database;
    
    //PLACEHOLDER
    constructor() {
        const dbPath = path.join(app.getPath("userData"), "app.db");
        this.database = new Database(dbPath);
        this.initializeDatabase();
    }

    private initializeDatabase() {
        //create tables for source metadata, projects, and page assets
        this.database.exec(`
            CREATE TABLE IF NOT EXISTS sources (
                id TEXT PRIMARY KEY,
                original_file_name TEXT NOT NULL,
                original_path TEXT NOT NULL,
                internal_path TEXT NOT NULL,
                page_count INTEGER NOT NULL,
                file_size INTEGER NOT NULL,
                checksum TEXT NOT NULL,
                imported_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS outputs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            );
        `);
    }

    insertFileToSourcesTable(source: SourceMetadata) {
        const insert = this.database.prepare(`
            INSERT INTO sources (
                id, original_file_name, original_path, internal_path, page_count, file_size, checksum, imported_at
            ) VALUES (?,?,?,?,?,?,?,?)
        `);

        insert.run (
            source.id, source.original_file_name, source.original_path, source.internal_path,
            source.page_count, source.file_size, source.checksum, source.imported_at
        )
    }

    insertFileToOutputsTable(source: OutputMetadata) {
        const insert = this.database.prepare(`
            INSERT INTO outputs (
                id, project_id, file_name, file_path, created_at
            ) values (?,?,?,?,?)
        `);

        insert.run (
            source.id, source.project_id, source.file_name, source.file_path, source.created_at
        )
    }

    getSourceByChecksum(checksum: string): SourceMetadata | null {
        const stmt = this.database.prepare("SELECT * FROM sources WHERE checksum = ?");
        const result = stmt.get(checksum);
        return result ? (result as SourceMetadata) : null;
    }

    // getSourceById (id: string): SourceMetadata | null {

    // }

    // saveProject(project: Project) {

    // }

    // getProject(id: string): Project | null {

    // }

    // getAllProjects() {
        
    // }
}