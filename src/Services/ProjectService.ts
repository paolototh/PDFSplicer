// src/Services/ProjectService.ts
import { DatabaseService } from "./DatabaseService.js";
import { Project, SinglePageAsset } from "./ZodSchemas.js";
import crypto from "crypto";

export class ProjectService {
    constructor(private databaseService: DatabaseService) {}

    async createProject(name: string): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        
        // better-sqlite3 stmt
        const stmt = (this.databaseService as any).database.prepare(`
            INSERT INTO projects (id, name, state, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(id, name, '[]', now, now);
        return id;
    }

    async updateProjectState(projectId: string, state: SinglePageAsset[]): Promise<void> {
        const now = new Date().toISOString();
        const stmt = (this.databaseService as any).database.prepare(`
            UPDATE projects SET state = ?, updated_at = ? WHERE id = ?
        `);
        
        stmt.run(JSON.stringify(state), now, projectId);
    }

    getProject(projectId: string): Project | null {
        const stmt = (this.databaseService as any).database.prepare(`
            SELECT * FROM projects WHERE id = ?
        `);
        const row = stmt.get(projectId);
        if (!row) return null;

        return {
            ...row,
            state: JSON.parse(row.state)
        } as Project;
    }
}