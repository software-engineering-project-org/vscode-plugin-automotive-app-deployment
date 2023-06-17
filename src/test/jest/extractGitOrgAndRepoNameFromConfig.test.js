const { ConfigStringExtractor } = require('../../svc/GitHubOps/ConfigStringExtractor');

describe('ConfigStringExtractor', () => {
  it('should extract the organization and repository name from .git/config file', async () => {
    const organizationAndRepository = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig();
    expect(organizationAndRepository).toMatch(/^[^/]+\/[^/]+$/);
  });
});