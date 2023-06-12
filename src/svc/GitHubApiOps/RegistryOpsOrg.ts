import { GitHubOctoAuth } from "./GitHubOctoAuth";

type PackageType = "container" | "docker"; // enum

// TODO: Do we want to convert the response, e.g. in an array of image-names under the package-type?
// If so, specify return type formatting separately in ./types ...

/**
 * Class for interacting with GitHub using an authenticated Octokit SDK object, fetching GitHub organization-specific registry information.
 */
export class RegistryOpsOrg {
  private gitHubOctokit: GitHubOctoAuth["octokitSdk"]

  /**
   * Constructs a new RegistryOpsOrg instance.
   * @param authStrategy - The authentication strategy to use (e.g. "accessTokenClassic").
   * @param token - The GitHub personal access token (classic) for authorization (mandatory for now).
   */
  constructor(authStrategy: string, token: string) {
    // Create an instance of GitHubOctoOps with the provided token
    // We outsource the actual Octokit-Constructor in "GitHubOctoAuth" class to encapsulate further Auth-Strategies if needed.
    const gitHubOctoAuth = new GitHubOctoAuth(authStrategy, token);
    this.gitHubOctokit = gitHubOctoAuth.octokitSdk;
  }


  /**
   * Fetches images from the GitHub Package Registry of an organization.
   * @param org - The organization name.
   * @param packageType - The type of package to fetch (see enum/type).
   * @returns - A Promise that resolves to an array of the organization's package images.
   * @throws {Error} - If an error occurs while retrieving the packages list.
   */
  async getOrganizationPackageImages(org: string, packageType: PackageType): Promise<any[]> {
    try {
      const response = await this.gitHubOctokit.request(`GET /orgs/${org}/packages?package_type=${packageType}`);
      return response.data;
    } catch (error) {
      console.error("Error retrieving package images:", error);
      throw error;
    }
  }


  // Do we really need this?
  /**
   * Fetches information about a specific package.
   * @param {string} org - The name of the organization.
   * @param {PackageType} packageType - The type of package (see enum/type).
   * @param {string} packageName - The name of the package. It's formatted like <org>/<package>.
   * @returns {Promise<any>} - A Promise that resolves to the package information.
   * @throws {Error} - If an error occurs while retrieving the specific package information.
   */
  async getPackageMetadata(org: string, packageType: PackageType, packageName: string): Promise<any> {
    try {
      packageName = packageName.replace("/", "%2F"); // Adjust formatting as API needs <org>%2F<package> as ref
      const response = await this.gitHubOctokit.request(`GET /orgs/${org}/packages/${packageType}/${packageName}`);
      return response.data;
    } catch (error) {
      console.error("Error retrieving package information:", error);
      throw error;
    }
  }

  /**
   * Fetches the versions of a specific package.
   * @param {string} org - The name of the organization.
   * @param {PackageType} packageType - The type of package (see enum/type).
   * @param {string} packageName - The name of the package. It's formatted like <org>/<package>.
   * @returns {Promise<any>} - A Promise that resolves to the package versions.
   * @throws {Error} - If an error occurs while retrieving the versions.
   */
  async getPackageVersions(org: string, packageType: PackageType, packageName: string): Promise<any> {
    try {
      packageName = packageName.replace("/", "%2F"); // Adjust formatting as API needs <org>%2F<package> as ref
      const response = await this.gitHubOctokit.request(`GET /orgs/${org}/packages/${packageType}/${packageName}/versions`);
      return response.data;
    } catch (error) {
      console.error("Error retrieving package information:", error);
      throw error;
    }
  }
}

// Usage example
const token = "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";
const authStrategy = "accessTokenClassic";
const registryOpsOrg = new RegistryOpsOrg(authStrategy, token);


// Fetch container images from an organization's GitHub Package Registry
const org = "software-engineering-project-org";
const packageType: PackageType = "container";
registryOpsOrg.getOrganizationPackageImages(org, packageType)
  .then((images) => {
    console.log("Organization's package images:", images);
  })
  .catch((error) => {
    console.error("Failed to retrieve package images:", error);
  });
  

// Fetch package information
const packageName = "vehicle-app-python-template/sampleapp";
registryOpsOrg.getPackageVersions(org, packageType, packageName)
  .then((packageInfo) => {
    console.log("Package information:", packageInfo);
  })
  .catch((error) => {
    console.error("Failed to retrieve package information:", error);
  });