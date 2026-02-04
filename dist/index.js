import { app } from "electron";
import { StorageService } from './Services/StorageService.js';
app.whenReady().then(async () => {
    //use npm start to run the electron app
    console.log("--- DEBUG START ---");
    try {
        const storageService = new StorageService();
        console.log("Initializing storage...");
        await storageService.initializeStorage();
        const result = await storageService.importNewFile("C:\\Paolo\\test.pdf");
        console.log(`Success! Path: ${result.targetPath}`);
        const outputPath = await storageService.saveGeneratedPDF(result.targetPath, "output.pdf");
        console.log(`Output saved at: ${outputPath}`);
        const storageSize = await storageService.getDiskSpaceUsage(storageService.getStoragePath);
        console.log(`Current storage size: ${storageSize} MB`);
        app.quit();
    }
    catch (err) {
        console.error("Storage Error:", err);
    }
});
//# sourceMappingURL=index.js.map