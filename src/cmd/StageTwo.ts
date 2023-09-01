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
import * as path from 'path';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { chooseDeviceFromListOrContext } from './DeviceCommands';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';
import { ServiceSsh } from '../svc/ServiceSsh';
import { TopConfig } from '../provider/TopConfig';
import { checkAndHandleTarSource } from '../helpers/helpers';

// Import setup constants from properties file.
import { TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH, TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH, MANIFEST_DIR, STAGE_TWO_CONSOLE_HEADER } from '../setup/cmdProperties';

/**
 * Implements Deployment Functionality for Stage 2:
 *
 *      0. Config initilization & Overview (QuickPick) & Dependency Check
 *      1. Connect to device with SSH
 *      2. Check if local-registries are set in Kanto Config
 *            - Check the /etc/container-management/config.json file
 *           - Examine the insecure-registries object
 *      3. Download tar source or reference from local device
 *      4. Copy the Tarball to the Leda Device via SCP
 *      5. Execute the containerd imports
 *      6. Insert the string (index.json) into the Manifest
 *      7. Copy the secured Manifest to the Leda Device via SCP
 *
 *
 */
export class StageTwo {
  public static deploy = async (item: LedaDeviceTreeItem): Promise<void> => {
    let device = item?.ledaDevice;
    device = await chooseDeviceFromListOrContext(device);

    // Init
    let stage02 = vscode.window.createOutputChannel('LAD Hybrid');
    stage02.show();
    stage02.appendLine(STAGE_TWO_CONSOLE_HEADER);

    /**
     * STEP 0
     */
    await TopConfig.init();

    /**
     * STEP 1 & 2
     */
    const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
    await serviceSsh.initializeSsh(stage02);
    await serviceSsh.checkDeviceDependencies(stage02);
    await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage02);
    await serviceSsh.loadAndCheckConfigJson(TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH, stage02);

    /**
     * STEP 3
     */
    const tarSource = await vscode.window.showInputBox({
      prompt: 'Image source',
      placeHolder: 'URL or File path',
    });
    if (!tarSource) {
      return;
    }

    const outputTarPath = await checkAndHandleTarSource(tarSource, stage02);

    /**
     * STEP 4
     */
    await serviceSsh.copyResourceToLeda(outputTarPath, `/tmp/${TopConfig.PACKAGE}.tar`, stage02);

    /**
     * STEP 5
     */
    const localRegTag = await serviceSsh.containerdOperations('', stage02);

    /**
     * STEP 6
     */
    const generator = new ManifestGeneratorJson(TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH);

    const keyValuePairs = {
      id: `${TopConfig.PACKAGE}`,
      name: `${TopConfig.PACKAGE}`,
      'image.name': localRegTag,
    };

    await new Promise((resolve) => {
      generator.generateKantoContainerManifest(keyValuePairs, stage02);
      setTimeout(resolve, 100); // Adjust the delay if needed
    });

    /**
     * STEP 7
     */
    await serviceSsh.copyResourceToLeda(path.resolve(__dirname, '../../', OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${TopConfig.PACKAGE}.json`, stage02);
    await serviceSsh.closeConn(stage02);

    stage02.appendLine(`Deploying to Leda:\t `);
    vscode.window.showInformationMessage(`Success. Container-Image "${keyValuePairs['image.name']}" is deployed to ${device.name}.`);
  };
}
