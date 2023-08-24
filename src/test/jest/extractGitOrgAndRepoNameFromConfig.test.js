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

const { ConfigStringExtractor } = require('../../svc/GitHubOperations/ConfigStringExtractor');

describe('ConfigStringExtractor', () => {
  it('should extract the organization and repository name from .git/config file', async () => {
    const gitConfig = "sample-config-git";
    const organizationAndRepository = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig(gitConfig);
    expect(organizationAndRepository).toMatch(/^[^/]+\/[^/]+$/);
  });
});