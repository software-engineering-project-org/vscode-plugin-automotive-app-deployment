import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper to get the organization and repository name out of the current Git working context.
 */
export class ConfigStringExtractor {
  /**
   * Extracts the organization and repository name from the remote origin URL specified in .git/config file.
   * @returns {Promise<string>} The organization and repository name.
   * @throws {Error} If the .git/config file is not found, remote origin URL is missing, or the URL is invalid.
   */
  public static extractGitOrgAndRepoNameFromConfig = async (): Promise<string> => {
    const gitConfigPath = path.resolve(__dirname, '../../../.git/config');

    try {
      const gitConfigContent = await fs.promises.readFile(gitConfigPath, 'utf8');

      // Look for [remote "origin"] and url = ... in config
      const remoteOriginRegex = /\[remote\s+"origin"\]\s*\n.*url\s*=\s*(\S+)/;
      const remoteOriginMatch = gitConfigContent.match(remoteOriginRegex);
      if (!remoteOriginMatch) throw new Error('Remote origin URL not found');

      // Extract URL from the matched pattern
      const url = remoteOriginMatch[1];

      // Extract organization and repository name from URL
      const orgRepoRegex = /github\.com\/([^\/]+\/[^\/]+)\.git/; // Define <org>/<repo> as captured group inside the matching pattern.
      const matches = url.match(orgRepoRegex);
      if (!matches) throw new Error('Invalid remote origin URL');
      
      // Return the first (and only) captured group in the match which is <org>/<repo>. [0] would be the entire match.
      const orgRepo = matches[1]; 

      return orgRepo;
    } catch (error: any) {
      throw new Error('Error reading .git/config: ' + (error as Error).message);
    }
  }
}