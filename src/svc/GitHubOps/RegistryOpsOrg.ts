import { JSONPath } from 'jsonpath-plus';

import { GitHubOctoAuth } from "./GitHubOctoAuth";
import { PackageVersion, PackageImage } from "../../interfaces/GitHubTypes";
import { ConfigStringExtractor } from "./ConfigStringExtractor";


type PackageType = "container" | "docker"; // enum

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
    // Create an instance of GitHubOctoOps with the provided token. We outsource the actual Octokit-Constructor in "GitHubOctoAuth" class to encapsulate further Auth-Strategies if needed.
    const gitHubOctoAuth = new GitHubOctoAuth(authStrategy, token);
    this.gitHubOctokit = gitHubOctoAuth.octokitSdk;
  }

  public async getPackageVersionsObj(packageType: PackageType): Promise<PackageVersion[]> {
    try {
      // Fetch Organization and Repository the user operates in from .git/config. This is named "context" in this module.
      // const orgRepoContext = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig();
      
      // NOTE --- TODO: Hardcode the context for development as the code and registry testing context are separated. Remove this in production!  
      const orgRepoContext = "software-engineering-project-org/vehicle-app-python-template";
      // Get the Organization name out of context.
      const orgName = orgRepoContext.split('/')[0];
  
      // For a given Organization, get all Package Images (of a package type). If we have n Repositories in that Organization, we get get 0...n entries.
      const orgPackagesList = await this.getOrganizationPackageImages(orgName, packageType);
  
      // Get exactly the package name matching the given context, thus the exact repo in the org the user operates in (of given package type).
      const packageNameOfRepo = this.extractPackageName(orgPackagesList, orgRepoContext);
      
      // Handle missing context match.
      if (packageNameOfRepo === null) {
        throw new Error("Failed to extract package name from the given organization-repository-context.");
      }
  
      // Get all versions of the package assigned to the Repository in context.
      const packageVersions = await this.getPackageVersions(orgName, packageType, packageNameOfRepo);
  
      // Map type.
      const packageVersionsObj: PackageVersion[] = packageVersions.map((item: any) => ({
        image_name_sha: item.name,
        tags: item.metadata.container.tags,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at)
      }));

      // TODO: Implement proper Logger
      console.log(`Retrieved image versions of context ${context}`);
      console.log(packageVersionsObj)
      return packageVersionsObj;
    } catch (error) {
      console.error("An error occurred:", error);
      throw error;
    }
  }
  
  /**
   * Helper to extract the package name out of a list of 1...n packages (of 1...n Repositories) in one Organization suiting the given context.
   * @param orgPackagesList - A list containing 1...n packages assigned to 1...n Repositories in an Organization.
   * @param orgRepoContext - Organization and Repository we the user acts in.
   * @returns - The name of the package or null if not found.
   */
  private extractPackageName(orgPackagesList: any, orgRepoContext: string): string | null {
    // Parse the data containing 1...n packages assigned to 1...n Repositories in an Organization.
    const json = JSON.parse(JSON.stringify(orgPackagesList));
    // Only get the name of the package assigned to the Repository matching the context.
    const filteredData = JSONPath({ path: `$[?(@.repository.full_name === "${orgRepoContext}")].name`, json: json });
  
    if (filteredData.length > 0) {
      return filteredData[0];
    }
    return null;
  }


  /**
   * Fetches images from the GitHub Package Registry of an organization.
   * @param org - The organization name.
   * @param packageType - The type of package to fetch (see enum/type).
   * @returns - A Promise that resolves to an array of the organization's package images.
   * @throws {Error} - If an error occurs while retrieving the packages list.
   */
  private async getOrganizationPackageImages(org: string, packageType: PackageType): Promise<any[]> {
    try {
      const response = await this.gitHubOctokit.request(`GET /orgs/${org}/packages?package_type=${packageType}`);
      return response.data;
    } catch (error) {
      console.error("Error retrieving package images:", error);
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
  private async getPackageVersions(org: string, packageType: PackageType, packageName: string): Promise<any> {
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
const token = "mytoken";
const authStrategy = "accessTokenClassic";
const registryOpsOrg = new RegistryOpsOrg(authStrategy, token);

registryOpsOrg.getPackageVersionsObj("container")