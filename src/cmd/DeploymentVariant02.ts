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
import axios from 'axios';
import * as fs from 'fs';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { chooseDeviceFromListOrContext } from './DeviceCommands';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';
import { ServiceSsh } from '../svc/ServiceSsh';
import { getExtensionResourcePath } from '../utils/helpers';
import { promisify } from 'util';
import { TopConfig } from '../provider/TopConfig';
import { InsecureWebSourceError, LocalPathNotFoundError, NotTARFileError, GenericInternalError, logToChannelAndErrorConsole } from '../error/customErrors';

// Import setup constants from properties file.
import { TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH, TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH, MANIFEST_DIR, DEPLOYMENT_VARIANT_02_CONSOLE_HEADER } from '../setup/cmdProperties';

/**
 * Implements Deployment Functionality for Deployment-Variant 02:
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
export class DeploymentVariant02 {
  public static deployWith = async (item: LedaDeviceTreeItem): Promise<void> => {
    let device = item?.ledaDevice;
    device = await chooseDeviceFromListOrContext(device);

    // Init
    await TopConfig.init();

    /**
     * STEP 0
     */
    let deploymentVariant02 = vscode.window.createOutputChannel('LAD Hybrid');
    deploymentVariant02.show();
    deploymentVariant02.appendLine(DEPLOYMENT_VARIANT_02_CONSOLE_HEADER);

    /**
     * STEP 0
     */
    await TopConfig.init();

    /**
     * STEP 1 & 2
     */
    const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
    await serviceSsh.initializeSsh(deploymentVariant02);
    await serviceSsh.checkDeviceDependencies(deploymentVariant02);
    await serviceSsh.getConfigFromLedaDevice(getExtensionResourcePath(TMP_KANTO_CONFIG_PATH), deploymentVariant02);
    await serviceSsh.loadAndCheckConfigJson(getExtensionResourcePath(TMP_KANTO_CONFIG_PATH), KANTO_CONFIG_LOCAL_REG_JSON_PATH, deploymentVariant02);

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

    const outputTarPath = await checkAndHandleTarSource(tarSource, deploymentVariant02);

    /**
     * STEP 4
     */
    await serviceSsh.copyResourceToLeda(outputTarPath, `/tmp/${TopConfig.PACKAGE}.tar`, deploymentVariant02);

    /**
     * STEP 5
     */
    const localRegTag = await serviceSsh.containerdOperations('', deploymentVariant02);

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
      generator.generateKantoContainerManifest(keyValuePairs, deploymentVariant02);
      setTimeout(resolve, 100); // Adjust the delay if needed
    });

    /**
     * STEP 7
     */
    await serviceSsh.copyResourceToLeda(getExtensionResourcePath(OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${TopConfig.PACKAGE}.json`, deploymentVariant02);
    await serviceSsh.closeConn(deploymentVariant02);

    deploymentVariant02.appendLine(`Deploying to Leda:\t `);
    vscode.window.showInformationMessage(`Success. Container-Image "${keyValuePairs['image.name']}" is deployed to ${device.name}.`);
  };
}

/**
 * Check the source of a TAR file and handle it accordingly.
 * @param src The source of the TAR file (can be a file path or a https URL).
 * @param chan The Visual Studio Code OutputChannel for logging.
 * @returns A Promise that resolves to the file path of the downloaded TAR file if applicable.
 * @throws Throws an error if the source is not valid or encounters any issues.
 */
export async function checkAndHandleTarSource(srcPath: string, chan: vscode.OutputChannel): Promise<string> {
  try {
    if (srcPath.startsWith('https://')) {
      return await downloadTarFileFromWeb(srcPath, `.vscode/tmp/${TopConfig.PACKAGE}.tar`, chan);
    } else if (srcPath.startsWith('http://')) {
      throw new InsecureWebSourceError(srcPath);
    } else {
      if (!fs.existsSync(srcPath)) {
        throw new LocalPathNotFoundError(srcPath);
      }
      if (!srcPath.endsWith('.tar')) {
        throw new NotTARFileError(srcPath);
      }
    }
    return srcPath;
  } catch (err) {
    throw logToChannelAndErrorConsole(
      chan,
      new GenericInternalError((err as Error).message),
      `Internal Error - An error orccured during the identification of the *.tar source under "${srcPath}". > SYSTEM: ${err}`,
    );
  }
}

/**
 * Download a TAR file from a URL and save it to a local path.
 * @param url The URL from which to download the TAR file.
 * @param localPath The local path where the TAR file will be saved.
 * @param chan The vscode OutputChannel for logging.
 * @returns A Promise that resolves to the file path of the downloaded TAR file.
 * @throws Throws an error if the download fails or encounters any issues.
 */
async function downloadTarFileFromWeb(url: string, localPath: string, chan: vscode.OutputChannel): Promise<string> {
  const writeFileAsync = promisify(fs.writeFile);
  try {
    const filename = getExtensionResourcePath(localPath);
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Write the downloaded data to the local file
    await writeFileAsync(filename, response.data);

    chan.appendLine(`Download finished for file from ${url}`);
    return filename;
  } catch (err) {
    chan.appendLine(`${err}`);
    throw new GenericInternalError(`Internal Error - Failed to read from URL: "${url}". > SYSTEM: ${err}`);
  }
}
