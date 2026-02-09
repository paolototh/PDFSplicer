import * as path from 'path';
import * as fs from 'fs/promises';
import { shell } from 'electron';
import { PDFDocument } from 'pdf-lib';
import { StorageService } from './StorageService.js';
import { DatabaseService } from './DatabaseService.js';
import { randomUUID } from 'crypto';

export class ExportService {
    constructor(
        private storageService: StorageService,
        private databaseService: DatabaseService
    ) {}

    async exportProject(projectId: string, projectName: string, pageAssets: any[]): Promise<string> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `${projectName}_${timestamp}.pdf`;
            const outPdf = await PDFDocument.create();

            for (const asset of pageAssets) {
                if (asset.type === "sourcePage") {
                    const sourceBytes = await fs.readFile(asset.internalPath);
                    const sourceDoc = await PDFDocument.load(sourceBytes);
                    const [copiedPage] = await outPdf.copyPages(sourceDoc, [asset.pageIndex]);
                    outPdf.addPage(copiedPage);
                } else if (asset.type === "blankPage") {
                    outPdf.addPage();
                }
            }

            const pdfBytes = await outPdf.save();
            const outputPath = path.join(this.storageService.getOutputsPath, fileName);
            await fs.writeFile(outputPath, pdfBytes);

            return outputPath;
        } catch (error) {
            throw new Error(`Export failed: ${error}`);
        }
    }
}