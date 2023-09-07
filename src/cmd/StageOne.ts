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

import * as vscode from 'vscode';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { chooseDeviceFromListOrContext } from './DeviceCommands';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';
import { ServiceSsh } from '../svc/ServiceSsh';
import { PackageVersion } from '../interfaces/GitHubTypes';
import { Octokit } from '@octokit/rest';
import { TopConfig } from '../provider/TopConfig';
import { RegistryOperationsOrg } from '../svc/GitHubOperations/RegistryOperationsOrg';
import { PackageQuickPickItem } from '../interfaces/QuickPickItem';

// Import setup constants from properties file.
import { CONTAINER_REGISTRY, TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_REMOTE_REG_JSON_PATH, TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH, MANIFEST_DIR, STAGE_ONE_CONSOLE_HEADER } from '../setup/cmdProperties';
import { getExtensionResourcePath } from '../helpers/helpers';

/**
 * Implements Deployment Functionality for Stage 1:
 *
 *      0. Config initilization & Overview (QuickPick) & Dependency Check
 *      1. Connect to device via SSH
 *      2. Check if local-registries are set in Kanto Config
 *           - Check the /etc/container-management/config.json file
 *           - Examine the registry_configurations object
 *      3. Generate a string and insert it into the Manifest
 *      4. Copy the secured Manifest to the Leda Device via SCP
 *
 */
export class StageOne {
  public static deploy = async (item: LedaDeviceTreeItem, octokit: Octokit): Promise<void> => {
    let device = item?.ledaDevice;
    device = await chooseDeviceFromListOrContext(device);

    await TopConfig.init();
    const packageVersion = (await this.getVersionsWithQuickPick(octokit)) as PackageVersion;

    //Create output channel for user
    let stage01 = vscode.window.createOutputChannel('LAD Remote');
    stage01.show();
    stage01.appendLine(STAGE_ONE_CONSOLE_HEADER);

    /**
     * STEP 1 & 2
     */
    const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
    await serviceSsh.initializeSsh(stage01);
    await serviceSsh.checkDeviceDependencies(stage01);
    await serviceSsh.getConfigFromLedaDevice(getExtensionResourcePath(TMP_KANTO_CONFIG_PATH), stage01);
    await serviceSsh.loadAndCheckConfigJson(getExtensionResourcePath(TMP_KANTO_CONFIG_PATH), KANTO_CONFIG_REMOTE_REG_JSON_PATH, stage01);

    /**
     * STEP 3
     */
    const generator = new ManifestGeneratorJson(TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH);

    const keyValuePairs = {
      id: `${TopConfig.PACKAGE}`,
      name: `${TopConfig.PACKAGE}`,
      'image.name': `${CONTAINER_REGISTRY.ghcr}/${TopConfig.ORG}/${TopConfig.REPO}/${TopConfig.PACKAGE}@${packageVersion.image_name_sha}`,
    };

    await new Promise((resolve) => {
      generator.generateKantoContainerManifest(keyValuePairs, stage01);
      setTimeout(resolve, 100); // Adjust the delay if needed
    });

    /**
     * STEP 4
     */
    await serviceSsh.copyResourceToLeda(getExtensionResourcePath(OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${TopConfig.PACKAGE}.json`, stage01);
    await serviceSsh.closeConn(stage01);

    stage01.appendLine(`Deploying to Leda:\t ${packageVersion.image_name_sha}`);
    vscode.window.showInformationMessage(`Success. Container-Image "${keyValuePairs['image.name']}" is deployed to ${device.name}.`);
  };

  private static getVersionsWithQuickPick = async (octokit: Octokit): Promise<any> => {
    const registryOperationsOrg = new RegistryOperationsOrg();

    const packageVersions = await registryOperationsOrg.getPackageVersionsObj(octokit);
    if (packageVersions) {
      const packageVersion = await vscode.window.showQuickPick(
        packageVersions.map((packageV: any) => {
          let tag = packageV.tags.length === 0 ? 'No tag avalaible' : packageV.tags[0];
          return {
            label: tag,
            description: packageV.updated_at,
            detail: packageV.image_name_sha,
            ...packageV,
          } as PackageQuickPickItem;
        }),
      );
      return packageVersion;
    }
  };
}
