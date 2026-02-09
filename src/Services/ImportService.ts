import { BrowserWindow } from 'electron';
import path from 'path';
import { StorageService } from './StorageService.js';
import { DatabaseService } from './DatabaseService.js';
import { ThumbnailService } from './ThumbnailService.js';
import { PDFService } from './PDFService.js';

export class ImportService {
    constructor(
        private storageService: StorageService,
        private databaseService: DatabaseService,
        private thumbnailService: ThumbnailService,
        private pdfService: PDFService
    ) {}

    async importFiles(paths: string[], window: BrowserWindow) {
        for (const filePath of paths) {
            try {
                const fileSize = await this.storageService.getFileSize(filePath);
                if (fileSize > 200 * 1024 * 1024) continue;

                const checksum = await this.storageService.calculateChecksum(filePath);
                const existing = this.databaseService.getSourceByChecksum(checksum);
                if (existing) continue;

                const fileId = crypto.randomUUID();
                const internalPath = await this.storageService.importNewFile(filePath, fileId);
                const pages = await this.pdfService.getPageCount(internalPath);

                // Šaljemo zahtjev frontendu za sliku
                await this.thumbnailService.generateThumbnail(window, internalPath, fileId);

                this.databaseService.insertFileToSourcesTable({
                    id: fileId,
                    original_file_name: path.basename(filePath),
                    original_path: filePath,
                    internal_path: internalPath,
                    page_count: pages,
                    file_size: fileSize,
                    checksum: checksum,
                    imported_at: new Date().toISOString()
                });
            } catch (e) {
                console.error("Greška kod importa:", e);
            }
        }
    }
}