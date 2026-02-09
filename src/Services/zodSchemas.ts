import * as z from "zod";

//schema for saving standardized metadata about source PDF files
export const SourceMetadataSchema = z.object({
    id: z.uuid(),
    original_file_name: z.string(),
    original_path: z.string(), //find file if it is missing from sources/
    internal_path: z.string(), //path inside sources/ folder
    page_count: z.number().positive(),
    //handle duplicate imports by checking if checksum is identical
    file_size: z.number(),
    checksum: z.string(),
    imported_at: z.iso.datetime()
});

//schema for a single page asset
export const SinglePageAssetSchema = z.union([
    //option 1: store the page from the source PDF
    z.object({
        type: z.literal("sourcePage"),
        sourceId: z.uuid(),
        pageIndex: z.number().int().nonnegative(),
        thumbnailPath: z.string()
    }),
    //option 2: insert a blank page
    z.object({
        type: z.literal("blankPage"),
        pageSize: z.enum(["A4", "Letter"]).default("A4"),
    })
]);

//schema for a project consisting of multiple page assets
//the project schema will be used to save the current state of the project,
//including the order of pages and their sources
export const ProjectSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1).max(100),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    state: z.array(SinglePageAssetSchema),
});

export const OutputMetadataSchema = z.object({
    id: z.uuid(),
    project_id: z.uuid(),
    file_name: z.string(),
    file_path: z.string(),
    created_at: z.iso.datetime()
});

export type SourceMetadata = z.infer<typeof SourceMetadataSchema>;
export type SinglePageAsset = z.infer<typeof SinglePageAssetSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type OutputMetadata = z.infer<typeof OutputMetadataSchema>;