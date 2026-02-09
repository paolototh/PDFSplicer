import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Servisi
import { StorageService } from "./Services/StorageService.js";
import { DatabaseService } from "./Services/DatabaseService.js";
import { PDFService } from "./Services/PDFService.js";
import { ThumbnailService } from "./Services/ThumbnailService.js";
import { ImportService } from "./Services/ImportService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
let testLock = false; // SPRJEČAVA BESKONAČNU PETLJU

const storageService = new StorageService();
const databaseService = new DatabaseService();
const pdfService = new PDFService(storageService);
const thumbnailService = new ThumbnailService(storageService);
const importService = new ImportService(storageService, databaseService, thumbnailService, pdfService);

async function bootstrap() {
    await storageService.initializeStorage();
    await app.whenReady();

    // app.getAppPath() pokazuje na root projekta (gdje je package.json)
    const rootPath = app.getAppPath();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // Preload je u dist folderu nakon tsc-a
            preload: path.join(rootPath, "dist", "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // Nužno za čitanje lokalnih PDF-ova u Renderer-u
        }
    });

    // Učitaj index.html iz roota
    const indexPath = path.join(rootPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
        await mainWindow.loadFile(indexPath);
    } else {
        console.error("❌ KRITIČNO: index.html nije pronađen na: " + indexPath);
    }

    mainWindow.webContents.openDevTools();

    // Handler za spremanje slika koje pošalje Frontend
    ipcMain.handle('save-thumbnail-to-disk', async (_, { fileId, imageData }) => {
        return await storageService.saveThumbnailFromBase64(fileId, imageData);
    });

    // Testni uvoz - samo jednom!
    mainWindow.webContents.on('did-finish-load', async () => {
        if (testLock) return;
        testLock = true;

        const testFile = "C:\\Paolo\\test.pdf";
        if (fs.existsSync(testFile)) {
            console.log("🚀 Pokrećem import test...");
            await importService.importFiles([testFile], mainWindow!);
        }
    });
}

app.on("window-all-closed", () => app.quit());
bootstrap();