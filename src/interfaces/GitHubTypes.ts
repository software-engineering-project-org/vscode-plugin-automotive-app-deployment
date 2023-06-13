export interface PackageVersion{
    image: string, // Metadata.container.tags[0]
    created_at: Date,
    updated_at: Date,
    name_sha: string
}