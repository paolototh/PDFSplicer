import * as electron from 'electron';
const { app, shell } = electron;
import path from 'path';
import { join } from 'path';
import fs from 'fs/promises';
import { readdir, stat } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
    private baseDirectory: string;
    private sourcesDirectory: string;
    private outputsDirectory: string;
    private thumbnailsDirectory: string;

    //initialize the storage path and create the folder structure
    //i am initializing the variables so i can create getters for them later
    constructor(){
        this.baseDirectory = app.getPath("userData");
        this.sourcesDirectory = path.join(this.baseDirectory, "sources");
        this.outputsDirectory = path.join(this.baseDirectory, "outputs");
        this.thumbnailsDirectory = path.join(this.baseDirectory, "thumbnails");

        this.initializeStorage();
    }

    // create the folder structure inside the storage
    // i have the paths, now i must use mkdir to create them
    async initializeStorage(): Promise<void> { //FR-APP-003: Create folder structure on first launch
        //app.getPath returns the path to the appdata folder for the given OS    
        
        const directories = [this.sourcesDirectory, this.outputsDirectory, this.thumbnailsDirectory];

        for (const dir of directories) {
            try {
                //who is allowing me to make a directory? The fs module!
                //recursive allows me to create nested directories if they don't exist
                await fs.mkdir(dir, { recursive: true });
                //also no risk error if the directory already exists
            } catch (error) {
                throw new Error(`Failed to create directory ${dir}: ${error}`);
            }
        }
    }

    //FR-IMP-005 Copy imported PDFs to sources/ folder with unique identifiers
    async importNewFile(originalFilePath: string): Promise<{targetPath: string, fileId: string}> {
        try {
            const fileId = uuidv4();
            const targetPath = path.join(this.sourcesDirectory, `${fileId}.pdf`);
            await fs.copyFile(originalFilePath, targetPath);
            return { targetPath, fileId };
        } catch (error) {
            throw new Error(`Failed to import file ${originalFilePath}: ${error}`);
        } 
    }

    //FR-GEN-005 Save outputs to outputs/ folder
    async saveGeneratedPDF(sourcesFilePath: string, outputsFileName: string): Promise<string> {
        try {
            const outputsFilePath = path.join(this.outputsDirectory, outputsFileName);
            await fs.copyFile(sourcesFilePath, outputsFilePath);
            return outputsFilePath;
        } catch (error) {
            throw new Error(`Failed to save outputs file ${outputsFileName}: ${error}`);
        }
    }

    //FR-HIST-003: Reveal generated file in system file explorer
    //no need for async since shell.showItemInFolder is synchronous
    revealInFileExplorer(filePath: string): void {
        shell.showItemInFolder(filePath);
    }

    //FR-HIST-007: Delete outputs with confirmation (moves to system trash)
    async deleteFile(filePath: string): Promise<void> {
        try{
            await shell.trashItem(filePath);
        } catch (error) {
            throw new Error(`Failed to delete file ${filePath}: ${error}`);
        }
    }

    //FR-HIST-011: Show disk space usage summary
    async getDiskSpaceUsage(directory: string): Promise<number> {
        let totalBytes = 0;

        const files = await readdir(directory, { withFileTypes: true });

        for (const file of files) {
            //Store the path to the file, this helps with recursion
            const filePath = join(directory, file.name);
            //Check if it's a directory or a file
            if (file.isDirectory()) {
                totalBytes += await this.getDiskSpaceUsage(filePath);
            } else {
                const fileStats = await stat(filePath);
                totalBytes += fileStats.size;
            }

        }
        const mb = totalBytes / 1024 / 1024;
        return Math.round(mb * 100) / 100;
    }

    //GET methods for the directory paths
    get getStoragePath(): string { return this.baseDirectory; }
    get getSourcesPath(): string { return this.sourcesDirectory; }
    get getoutputsPath(): string { return this.outputsDirectory; }
    get getThumbnailsPath(): string { return this.thumbnailsDirectory; }
    //Allows me to use the database path when initializing the database service
    get getDatabasePath(): string { return path.join(this.baseDirectory, "app.db"); }
}