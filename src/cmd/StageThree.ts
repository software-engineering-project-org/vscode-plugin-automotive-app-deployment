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
import { TopConfig } from '../provider/TopConfig';
import { DockerOperations } from '../svc/DockerOperations';

// Import setup constants from properties file.
import { CONTAINER_REGISTRY, TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH, TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH, MANIFEST_DIR, STAGE_THREE_CONSOLE_HEADER } from '../setup/cmdProperties';
import { getExtensionResourcePath } from '../helpers/helpers';

/**
 * Implements Deployment Functionality for Stage 3:
 *
 *      0. Config initilization & Overview (QuickPick) & Dependency Check
 *      1. Build Docker Image (checks included)
 *      2. Export it as a Tarball (to .vscode/tmp/*.tar)
 *      3. Connect to device via SSH
 *      4. Check if local-registries are set in Kanto Config
 *           - Check the /etc/container-management/config.json file
 *           - Examine the insecure-registries object
 *      5. Copy the Tarball to the Leda Device via SCP
 *      6. Execute the containerd commands
 *      7. Insert the string (index.json) into the Manifest
 *      8. Copy the secured Manifest to the Leda Device via SCP
 *
 */
export class StageThree {
  public static deploy = async (item: LedaDeviceTreeItem): Promise<void> => {
    let device = item?.ledaDevice;
    device = await chooseDeviceFromListOrContext(device);

    //Init
    await TopConfig.init();

    //Create output channel for user
    let stage03 = vscode.window.createOutputChannel('LAD Local');
    stage03.show();
    stage03.appendLine(STAGE_THREE_CONSOLE_HEADER);

    /**
     * STEP 1
     */
    const dockerOperations = new DockerOperations();
    const tag = await dockerOperations.buildDockerImage(stage03);

    /**
     * STEP 2
     */
    const tarPath = await dockerOperations.exportImageAsTarball(`${CONTAINER_REGISTRY.ghcr}/${tag}`, stage03);

    /**
     * STEP 3 & 4
     */
    const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
    await serviceSsh.initializeSsh(stage03);
    await serviceSsh.checkDeviceDependencies(stage03);
    await serviceSsh.getConfigFromLedaDevice(getExtensionResourcePath(TMP_KANTO_CONFIG_PATH), stage03);
    await serviceSsh.loadAndCheckConfigJson(getExtensionResourcePath(TMP_KANTO_CONFIG_PATH), KANTO_CONFIG_LOCAL_REG_JSON_PATH, stage03);

    /**
     * STEP 5
     */
    await serviceSsh.copyResourceToLeda(tarPath, `/tmp/${TopConfig.PACKAGE}.tar`, stage03);

    /**
     * STEP 6
     */
    const localRegTag = await serviceSsh.containerdOperations(`${tag}`, stage03);

    /**
     * STEP 7
     */
    const generator = new ManifestGeneratorJson(TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH);

    const keyValuePairs = {
      id: `${TopConfig.PACKAGE}`,
      name: `${TopConfig.PACKAGE}`,
      'image.name': localRegTag,
    };

    await new Promise((resolve) => {
      generator.generateKantoContainerManifest(keyValuePairs, stage03);
      setTimeout(resolve, 100); // Adjust the delay if needed
    });

    /**
     * STEP 8
     */
    await serviceSsh.copyResourceToLeda(getExtensionResourcePath(OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${TopConfig.PACKAGE}.json`, stage03);
    await serviceSsh.closeConn(stage03);

    stage03.appendLine(`Deploying to Leda:\t ${localRegTag}`);
    vscode.window.showInformationMessage(`Success. Container-Image "${keyValuePairs['image.name']}" is deployed to ${device.name}.`);
  };
}
