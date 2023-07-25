import { Octokit } from '@octokit/core';

/**
 * This class constructs an authorized GitHub Octokit SDK for further usage.
 * NOTE: We outsource the actual Octokit-Constructor to encapsulate further Auth-Strategies if needed.
 */
export class GitHubOctoAuth {
  private octokit: Octokit;

  /**
   * Constructs a new GitHubOctoAuth instance.
   * @param authMethod - The strategy to authenticate. NOTE: As we only have Access-Token (classic), simply pass "accessTokenClassic" for now.
   * @param classicToken - The GitHub personal access token for authorization.
   */
  constructor(authMethod: string, classicToken: string) {
    // Create an instance of Octokit with the provided token
    // For now classicToken as default
    this.octokit = new Octokit({ auth: classicToken });
  }

  /**
   * Getter for instance.
   * @returns The Octokit instance.
   */
  get octokitSdk(): Octokit {
    return this.octokit;
  }
}
