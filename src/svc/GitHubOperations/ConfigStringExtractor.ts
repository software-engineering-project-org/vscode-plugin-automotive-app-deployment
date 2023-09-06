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

import * as fs from 'fs';
import { RemoteOriginNotFoundError, InvalidRemoteOriginError, GenericInternalError } from '../../error/customErrors';
import { getExtensionResourcePath } from '../../helpers/helpers';

/**
 * Helper to get the organization and repository name out of the current Git working context.
 */
export class ConfigStringExtractor {
  /**
   * Extracts the organization and repository name from the remote origin URL specified in .git/config file.
   * @returns {Promise<string>} The organization and repository name.
   * @throws {Error} If the .git/config file is not found, remote origin URL is missing, or the URL is invalid.
   */
  public static extractGitOrgAndRepoNameFromConfig = async (gitConfig: string): Promise<string> => {
    const gitConfigPath = getExtensionResourcePath(gitConfig);

    try {
      const gitConfigContent = await fs.promises.readFile(gitConfigPath, 'utf8');

      // Look for [remote "origin"] and url = ... in config
      const remoteOriginRegex = /\[remote\s+"origin"\]\s*\n.*url\s*=\s*(\S+)/;
      const remoteOriginMatch = remoteOriginRegex.exec(gitConfigContent);
      if (!remoteOriginMatch) {
        throw new RemoteOriginNotFoundError(gitConfig);
      }
      // Extract URL from the matched pattern
      const url = remoteOriginMatch[1];

      // Extract organization and repository name from URL
      const orgRepoRegex = /github\.com\/([^/]+\/[^/]+)\.git/;
      const matches = orgRepoRegex.exec(url);
      if (!matches) {
        throw new InvalidRemoteOriginError(gitConfig);
      }
      // Return the first (and only) captured group in the match which is <org>/<repo>. [0] would be the entire match.
      const orgRepo = matches[1];

      return orgRepo;
    } catch (err: any) {
      if (err instanceof RemoteOriginNotFoundError || err instanceof InvalidRemoteOriginError) {
        // Handle specific errors here (e.g., log, display error message, etc.)
        throw err; // Re-throw the caught error to propagate it further if needed
      } else {
        // Handle other errors
        throw new GenericInternalError(err);
      }
    }
  };
}
