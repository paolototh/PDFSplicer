import * as pdflib from "pdf-lib";
import fs from "node:fs/promises";
import { StorageService } from "./StorageService.js";

export class PDFService {

    constructor(private storageService: StorageService){}
    
    async getPageCount(filePath: string): Promise<number> {
        const readFile = await fs.readFile(filePath);
        const pdf = await pdflib.PDFDocument.load(readFile, { ignoreEncryption: true });
        return pdf.getPageCount();
    }
}   