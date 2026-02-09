// Services/ThumbnailService.ts
import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { StorageService } from './StorageService.js';

// Definiramo tip podataka za detalje mape radi TypeScripta
interface FolderDetail {
    path: string;
    size: number;
    mtime: number;
}

const CACHE_LIMIT = 1024 * 1024 * 1024; // 1GB limit

export class ThumbnailService {
    private thumb_width: number = 200;
    private thumb_height: number = 280;

    constructor(
        private storageService: StorageService
    ) {}

    /**
     * Glavna metoda koju poziva ImportService.
     * Šalje zahtjev Renderer procesu da nacrta sliku koristeći Chromium engine.
     */
    async generateThumbnail(window: BrowserWindow, filePath: string, fileId: string): Promise<void> {
        try {
            // 1. Kreiraj folder za thumbnail ako ne postoji
            const outputDir = path.join(this.storageService.getThumbnailsPath, fileId);
            await fs.mkdir(outputDir, { recursive: true });

            console.log(`📢 Šaljem zahtjev za generiranje thumbnaila: ${fileId}`);

            // 2. POŠALJI PORUKU FRONTENDU (Rendereru)
            // Šaljemo preko IPC-a jer Frontend ima ugrađen browser Canvas
            window.webContents.send('generate-thumbnail-request', {
                filePath,
                fileId,
                width: this.thumb_width,
                height: this.thumb_height
            });

            // 3. Pokreni čišćenje cachea asinkrono
            this.cleanupCache().catch(err => console.error("Greška pri čišćenju cachea:", err));
        } catch (error) {
            console.error(`Greška u generateThumbnail za file ${fileId}:`, error);
        }
    }

    /**
     * Čisti najstarije thumbnailove ako ukupna veličina prijeđe limit.
     */
    async cleanupCache(): Promise<void> {
        try {
            const thumbnailsPath = this.storageService.getThumbnailsPath;
            const folders = await fs.readdir(thumbnailsPath);
            
            // POPRAVAK: Eksplicitno definiramo tip niza kao FolderDetail[]
            const folderDetails: FolderDetail[] = [];

            for (const folderName of folders) {
                const folderPath = path.join(thumbnailsPath, folderName);
                const stats = await fs.stat(folderPath);
                
                // Dohvaćamo točnu veličinu mape koristeći metodu iz StorageService
                const exactSize = await this.storageService.getFolderDiskSpaceUsage(folderPath);

                folderDetails.push({
                    path: folderPath,
                    size: exactSize,
                    mtime: stats.mtimeMs
                });
            }

            let totalSize = folderDetails.reduce((acc, f) => acc + f.size, 0);
            
            // Ako smo unutar limita, ne brišemo ništa
            if (totalSize <= CACHE_LIMIT) return;

            // Sortiramo: najstariji folderi (po mtime) idu prvi
            folderDetails.sort((a, b) => a.mtime - b.mtime);

            for (const folder of folderDetails) {
                if (totalSize <= CACHE_LIMIT) break;
                
                // Brišemo cijelu mapu s thumbnailovima za taj PDF
                await fs.rm(folder.path, { recursive: true, force: true });
                totalSize -= folder.size;
                console.log(`🧹 Obrisana stara predmemorija thumbnailova: ${folder.path}`);
            }
        } catch (error) {
            console.error('Kritična greška u cleanupCache:', error);
        }
    }

    // Pomoćne metode za postavljanje dimenzija
    setDimensions(width: number, height: number): void {
        this.thumb_width = width;
        this.thumb_height = height;
    }

    getThumbWidth(): number { return this.thumb_width; }
    getThumbHeight(): number { return this.thumb_height; }
}