//this class helps me determine what operating system the user is using so i can set paths accordingly
import * as path from 'path';
import * as fs from 'fs';
import os from 'os';

// ts requires the export keyword for this class to be available outside this file
export class WorkspaceService {
    private workspacePath: string;
    private folderNames: string[] = [
        'sources',
        'outputs',
        'thumbnails'
    ];

    constructor() {
        this.workspacePath = this.returnWorkspacePath();
        this.createFolderStructure();
    }

    //create the folder structure inside the workspace
    createFolderStructure(): void {
        if (!fs.existsSync(this.workspacePath)) {
            fs.mkdirSync(this.workspacePath, { recursive: true });
        }
        
        this.folderNames.forEach(folderName => {
            const fullPath = path.join(this.workspacePath, folderName);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });
    }

    //determine the OS and return the workspace path accordingly 
    //node.js doesn't use shortcuts like ~ for home directory, so we need to use os.homedir() method
    //a shorthand is a shortcut which is used by the shell, OS modules don't recognize them
    returnWorkspacePath(): string {
        const platform = os.platform();
        const homeDir = os.homedir();
        
        switch(platform) {
            case "win32":
                return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'PDFReorganizer');
            case "linux":
                return path.join(homeDir, '.pdfreorganizer');
        }
    }
}