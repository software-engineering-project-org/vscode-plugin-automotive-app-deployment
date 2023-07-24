// Versions of a GitHub Registry Package in the Build Image assigned to a Repo of an Org.
// (n PackageVersions : 1 Repository)
export interface PackageVersion {
  image_name_sha: string; // Unique identifier of a Version
  tags: string[]; // Tags associated with the version, empty if no tags given
  created_at: string; // Timestamp indicating when the version was created
  updated_at: string; // Timestamp indicating when the version was last updated
}

// Helper interface for RegistryOpsOrg Class methods.
export interface PackageImage {
  name: string; // Name of the package image
  repository: {
    full_name: string; // Full name of the repository associated with the package image
  };
}
