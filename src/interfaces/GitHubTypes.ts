// Versions of a GitHub Registry Package in the Build Image assigned to a Repo of an Org.
// (n PakageVersions : 1 Repository)
export interface PackageVersion {
  image_name_sha: string; // Unique identifies of a Version
  tags: string[]; // Metadata.container.tags[], empty if no tags given
  created_at: string;
  updated_at: string;
}

// Helper interface for RegistryOpsOrg Class methods.
export interface PackageImage {
  name: string;
  repository: {
    full_name: string;
  };
}
