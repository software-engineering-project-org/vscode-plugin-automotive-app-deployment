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
