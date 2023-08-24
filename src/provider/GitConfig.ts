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

import { VELOCITAS_CONFIG_FILE } from '../setup/cmdProperties';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';

export class GitConfig {
  public static ORG: string;
  public static REPO: string;
  public static PACKAGE: string;
  public static DOCKERFILE: string;
  public static KCM_TIMESTAMP: string; 

  public static async init() {
    const velocitasSettings = await ManifestGeneratorJson.readVelocitasJson(VELOCITAS_CONFIG_FILE);
    const manifestData = await ManifestGeneratorJson.readAppManifest(velocitasSettings.AppManifestPath);
    const remoteOrigin = velocitasSettings.GithubRepoId;
    this.DOCKERFILE = velocitasSettings.DockerfilePath;
    this.ORG = remoteOrigin.split('/')[0];
    this.REPO = remoteOrigin.split('/')[1];
    this.PACKAGE = manifestData.Name;

    const d = new Date();
    this.KCM_TIMESTAMP = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
  }
}
