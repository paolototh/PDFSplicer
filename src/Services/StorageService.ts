// Services/StorageService.ts
import { app, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import { createReadStream, existsSync } from 'fs';

/**
 * StorageService upravlja svim interakcijama s diskom (FileSystem).
 * Odgovoran je za inicijalizaciju mapa, kopiranje PDF-ova, 
 * izračun checksuma i spremanje generiranih thumbnailova.
 */
export class StorageService {
    private baseDirectory: string;
    private sourcesDirectory: string;
    private outputsDirectory: string;
    private thumbnailsDirectory: string;

    constructor() {
        // app.getPath("userData") vraća putanju do AppData/Roaming/ime-aplikacije
        this.baseDirectory = app.getPath("userData");
        this.sourcesDirectory = path.join(this.baseDirectory, "sources");
        this.outputsDirectory = path.join(this.baseDirectory, "outputs");
        this.thumbnailsDirectory = path.join(this.baseDirectory, "thumbnails");
    }

    /**
     * FR-APP-003: Kreira strukturu mapa prilikom prvog pokretanja.
     */
    async initializeStorage(): Promise<void> {
        const directories = [
            this.sourcesDirectory, 
            this.outputsDirectory, 
            this.thumbnailsDirectory
        ];

        for (const dir of directories) {
            try {
                if (!existsSync(dir)) {
                    await fs.mkdir(dir, { recursive: true });
                }
            } catch (error) {
                throw new Error(`Kritična greška pri kreiranju direktorija ${dir}: ${error}`);
            }
        }
    }

    /**
     * Vraća veličinu datoteke u bajtovima.
     */
    async getFileSize(filePath: string): Promise<number> {
        try {
            const fileStats = await fs.stat(filePath);
            return fileStats.size;
        } catch (error) {
            console.error(`Greška pri dohvaćanju veličine datoteke: ${filePath}`, error);
            return 0;
        }
    }

    /**
     * FR-HIST-011: Rekurzivno izračunava zauzeće diska za određenu mapu.
     */
    async getFolderDiskSpaceUsage(directory: string): Promise<number> {
        try {
            if (!existsSync(directory)) return 0;

            const files = await fs.readdir(directory, { withFileTypes: true });
            
            const sizePromises = files.map(async (file) => {
                const filePath = path.join(directory, file.name);

                if (file.isDirectory()) {
                    return this.getFolderDiskSpaceUsage(filePath);
                } else {
                    const stats = await fs.stat(filePath);
                    return stats.size;
                }
            });

            const fileSizes = await Promise.all(sizePromises);
            return fileSizes.reduce((total, size) => total + size, 0);
        } catch (error) {
            console.error(`Greška pri izračunu zauzeća diska za ${directory}`, error);
            return 0;
        }
    }

    /**
     * FR-IMP-005: Kopira uvezeni PDF u 'sources/' mapu s novim ID-em.
     */
    async importNewFile(originalFilePath: string, fileId: string): Promise<string> {
        try {
            const targetPath = path.join(this.sourcesDirectory, `${fileId}.pdf`);
            await fs.copyFile(originalFilePath, targetPath);
            return targetPath;
        } catch (error) {
            throw new Error(`Greška pri kopiranju datoteke u sources: ${error}`);
        } 
    }

    /**
     * FR-GEN-005: Sprema generirani PDF u 'outputs/' mapu.
     */
    async saveGeneratedPDF(tempFilePath: string, outputsFileName: string): Promise<string> {
        try {
            const outputsFilePath = path.join(this.outputsDirectory, outputsFileName);
            await fs.copyFile(tempFilePath, outputsFilePath);
            return outputsFilePath;
        } catch (error) {
            throw new Error(`Greška pri spremanju izlaznog PDF-a: ${error}`);
        }
    }

    /**
     * Sprema Base64 sliku dobivenu iz Frontenda kao JPG datoteku na disk.
     */
    async saveThumbnailFromBase64(fileId: string, base64Data: string): Promise<string> {
        try {
            const outputDir = path.join(this.thumbnailsDirectory, fileId);
            if (!existsSync(outputDir)) {
                await fs.mkdir(outputDir, { recursive: true });
            }

            // Uklanja Base64 header ako postoji (npr. data:image/jpeg;base64,)
            const base64Image = base64Data.includes(';base64,') 
                ? base64Data.split(';base64,').pop() 
                : base64Data;

            if (!base64Image) throw new Error("Neispravni Base64 podaci");

            const filePath = path.join(outputDir, '0.jpg');
            await fs.writeFile(filePath, base64Image, { encoding: 'base64' });
            
            return filePath;
        } catch (error) {
            throw new Error(`Greška pri spremanju thumbnaila: ${error}`);
        }
    }

    /**
     * FR-HIST-003: Otvara mapu u system exploreru i fokusira datoteku.
     */
    revealInFileExplorer(filePath: string): void {
        if (existsSync(filePath)) {
            shell.showItemInFolder(filePath);
        }
    }

    /**
     * FR-HIST-007: Šalje datoteku u sistemski koš za smeće (Trash/Recycle Bin).
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            if (existsSync(filePath)) {
                await shell.trashItem(filePath);
            }
        } catch (error) {
            throw new Error(`Greška pri brisanju datoteke: ${error}`);
        }
    }

    /**
     * Izračunava SHA-256 Checksum datoteke (korištenje Stream-a za velike PDF-ove).
     */
    async calculateChecksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = createHash("sha256");
            const stream = createReadStream(filePath);

            stream.on("data", (data) => hash.update(data));
            stream.on("end", () => resolve(hash.digest("hex")));
            stream.on("error", (err) => reject(err));
        });
    }

    // --- GETTERI ZA PUTANJE ---
    get getStoragePath(): string { return this.baseDirectory; }
    get getSourcesPath(): string { return this.sourcesDirectory; }
    get getOutputsPath(): string { return this.outputsDirectory; }
    get getThumbnailsPath(): string { return this.thumbnailsDirectory; }
    get getDatabasePath(): string { return path.join(this.baseDirectory, "app.db"); }
}