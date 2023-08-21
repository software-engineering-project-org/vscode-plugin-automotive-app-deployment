/**
 * Copyright (c) 2023 Contributors to the Eclipse Foundation
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONPath } from 'jsonpath-plus';
import { PackageVersion } from '../../interfaces/GitHubTypes';
import { Octokit } from '@octokit/rest';
import { GitConfig } from '../../provider/GitConfig';
import { PACKAGE_TYPE } from '../../setup/cmdProperties';
import { PackageImagesFetchError, PackageVersionsFetchError, PackageNameNotFoundError } from '../../error/customErrors';

/**
 * Class for interacting with GitHub using an authenticated Octokit SDK object, fetching GitHub organization-specific registry information.
 */
export class RegistryOpsOrg {
  public async getPackageVersionsObj(octokit: Octokit): Promise<PackageVersion[]> {
    try {
      // Fetch Organization and Repository the user operates in from .git/config. This is named "context" in this module.
      // const orgRepoContext = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig();

      // Get all versions of the package assigned to the Repository in context.
      const packageVersions = await this.getPackageVersions(octokit);

      // Map type.
      const packageVersionsObj: PackageVersion[] = packageVersions.map((item: any) => ({
        image_name_sha: item.name,
        tags: item.metadata.container.tags,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return packageVersionsObj;
    } catch (err: any) {
      throw new PackageVersionsFetchError(err.message);
    }
  }

  /**
   * Helper to extract the package name out of a list of 1...n packages (of 1...n Repositories) in one Organization suiting the given context.
   * @param orgPackagesList - A list containing 1...n packages assigned to 1...n Repositories in an Organization.
   * @param orgRepoContext - Organization and Repository we the user acts in.
   * @returns - The name of the package or null if not found.
   */
  private extractPackageName(orgPackagesList: any, orgRepoContext: string): string | null {
    try {
      // Parse the data containing 1...n packages assigned to 1...n Repositories in an Organization.
      const json = JSON.parse(JSON.stringify(orgPackagesList));
      // Only get the name of the package assigned to the Repository matching the context.
      const filteredData = JSONPath({
        path: `$[?(@.repository.full_name === "${GitConfig.REPO}")].name`,
        json: json,
      });

      if (filteredData.length > 0) {
        return filteredData[0];
      }
      return null;
    } catch (err: any) {
      throw new PackageNameNotFoundError(err.message);
    }
  }

  /**
   * Fetches images from the GitHub Package Registry of an organization.
   * @returns - A Promise that resolves to an array of the organization's package images.
   * @throws {Error} - If an error occurs while retrieving the packages list.
   */
  private async getOrganizationPackageImages(octokit: Octokit): Promise<any[]> {
    try {
      const response = await octokit.request(`GET /orgs/${GitConfig.ORG}/packages?package_type=${PACKAGE_TYPE}`);
      return response.data;
    } catch (err: any) {
      throw new PackageImagesFetchError(err.message);
    }
  }

  /**
   * Fetches the versions of a specific package.
   * @returns {Promise<any>} - A Promise that resolves to the package versions.
   * @throws {Error} - If an error occurs while retrieving the versions.
   */
  private async getPackageVersions(octokit: Octokit): Promise<any> {
    try {
      const response = await octokit.packages.getAllPackageVersionsForPackageOwnedByOrg({
        org: GitConfig.ORG,
        package_type: PACKAGE_TYPE,
        package_name: `${GitConfig.REPO}/${GitConfig.PACKAGE}`,
      });
      return response.data;
    } catch (err: any) {
      throw new PackageVersionsFetchError(err.message);
    }
  }
}
