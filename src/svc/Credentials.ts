import * as vscode from 'vscode';
import * as Octokit from '@octokit/rest';

const GITHUB_AUTH_PROVIDER = 'github';
const SCOPES = ['user:email', 'repo', 'read:packages'];

export class Credentials {
  octokit?: Octokit.Octokit;

  async getOctokit(): Promise<Octokit.Octokit> {
    if (this.octokit) {
      return this.octokit;
    }
    const session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER,
      SCOPES,
      { createIfNone: true },
    );
    this.octokit = new Octokit.Octokit({
      auth: session.accessToken,
    });

    return this.octokit;
  }
}
