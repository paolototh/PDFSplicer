import zod from "zod";



//schema for a single page asset
export const SinglePageAssetSchema = zod.union([
    //option 1: store the page from the source PDF
    zod.object({
        type: zod.literal("sourcePage"),
        sourceId: zod.string().uuid(),
        pageNumber: zod.number().int().positive(),
    }),
    //option 2: insert a blank page
    zod.object({
        type: zod.literal("blankPage"),
        pageSize: zod.enum(["A4", "Letter"]).default("A4"),
    })
]);

//schema for a project consisting of multiple page assets
export const ProjectSchema = zod.object({
    id: zod.string().uuid(),
    name: zod.string().min(1).max(100),
    createdAt: zod.string().datetime(),
    updatedAt: zod.string().datetime(),
    state: zod.array(SinglePageAssetSchema),
});

//schema for saving standardized metadata about source PDF files
export const SourceMetadataSchema = zod.object({
    id: zod.string().uuid(),
    title: zod.string().optional(),
    originalFileName: zod.string(),
    originalPath: zod.string(), //find file if it is missing from sources/
    internalPath: zod.string(), //path inside sources/ folder
    pageCount: zod.number().positive(),
    //handle duplicate imports by checking if checksum is identical
    checksum: zod.string(),
    importDateTime: zod.date(),
});

export type SourceMetadata = zod.infer<typeof SourceMetadataSchema>;