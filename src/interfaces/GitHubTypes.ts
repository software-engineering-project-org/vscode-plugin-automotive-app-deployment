export interface PackageVersion{
    image_name_sha: string, // Metadata.container.tags[0]
    tags: string
    created_at: Date,
    updated_at: Date,
}