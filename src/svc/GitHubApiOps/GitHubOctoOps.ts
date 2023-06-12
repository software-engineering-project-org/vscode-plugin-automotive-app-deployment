import { Octokit } from "@octokit/core";

/**
 * This class constructs an authorized GitHub SDK (Octokit SDK) for further usage.
 * Current Auth-Strategy: Access-Token Classic.
 */
export class GitHubOctoOps {
    public octokit: Octokit;
  
    /**
     * Constructs a new GitHubOctoOps instance.
     * @param token The GitHub personal access token for authorization.
     */
    constructor(classicToken: string) {
      // Create an instance of Octokit with the provided token
      this.octokit = new Octokit({ auth: classicToken });
    }
}