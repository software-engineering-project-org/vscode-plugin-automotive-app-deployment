import * as vscode from 'vscode';
import * as Octokit from '@octokit/rest';

const GITHUB_AUTH_PROVIDER = 'github';

// The scopes required for authentication
const SCOPES = ['user:email', 'repo', 'read:packages'];

export class Credentials {
  // The Octokit instance used for GitHub API calls
  octokit?: Octokit.Octokit;

  /**
   * Gets the Octokit instance for making GitHub API calls.
   * If the instance already exists, it returns it; otherwise, it creates a new one using the user's GitHub authentication token.
   *
   * @returns A Promise that resolves to the Octokit instance.
   */
  async getOctokit(): Promise<Octokit.Octokit> {
    // If the Octokit instance already exists, return it.
    if (this.octokit) {
      return this.octokit;
    }

    // Get the GitHub authentication session for the current user.
    // If no session exists, it creates one with the specified scopes.
    const session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER, SCOPES, { createIfNone: true });

    // Create a new Octokit instance using the user's GitHub access token.
    this.octokit = new Octokit.Octokit({
      auth: session.accessToken,
    });

    return this.octokit;
  }
}
