import { JSONPath } from 'jsonpath-plus';

import { PackageVersion } from "../../interfaces/GitHubTypes";
import { ConfigStringExtractor } from "./ConfigStringExtractor";
import { Octokit } from '@octokit/rest';

type PackageType = "container" | "docker"; // enum

/**
 * Class for interacting with GitHub using an authenticated Octokit SDK object, fetching GitHub organization-specific registry information.
 */
export class RegistryOpsOrg {

  public async getPackageVersionsObj(appName: string, packageType: PackageType, octokit: Octokit): Promise<PackageVersion[]> {
    try {
      // Fetch Organization and Repository the user operates in from .git/config. This is named "context" in this module.
      // const orgRepoContext = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig();
      
      // NOTE --- TODO: Hardcode the context for development as the code and registry testing context are separated. Remove this in production!  
      const remoteOrigin = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig("sample-config-git");
      const orgName = remoteOrigin.split("/")[0];
      const repoName = remoteOrigin.split("/")[1];
      const packageNameOfRepo = `${repoName}/${appName}`;
  
      // Get all versions of the package assigned to the Repository in context.
      const packageVersions = await this.getPackageVersions(orgName, packageType, packageNameOfRepo, octokit);
  
      // Map type.
      const packageVersionsObj: PackageVersion[] = packageVersions.map((item: any) => ({
        image_name_sha: item.name,
        tags: item.metadata.container.tags,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

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
    private async getOrganizationPackageImages(org: string, packageType: PackageType, octokit: Octokit): Promise<any[]> {
      try {
        const response = await octokit.request(`GET /orgs/${org}/packages?package_type=${packageType}`);
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
  private async getPackageVersions(org: string, package_type: PackageType, package_name: string, octokit: Octokit): Promise<any> {
    try {
      const response = await octokit.packages.getAllPackageVersionsForPackageOwnedByOrg({
        org,
        package_type,
        package_name
      })
      return response.data;
    } catch (error) {
      console.error("Error retrieving package information:", error);
      throw error;
    }
  }
}