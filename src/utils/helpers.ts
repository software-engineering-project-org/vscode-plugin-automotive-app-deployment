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

import { LedaDevice } from '../interfaces/LedaDevice';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { TopConfig } from '../provider/TopConfig';
import * as https from 'https';
import { InsecureWebSourceError, LocalPathNotFoundError, NotTARFileError, GenericInternalError, logToChannelAndErrorConsole } from '../error/customErrors';

/**
 * Load the list of Leda devices from the configuration.
 * @returns A Promise that resolves to an array of LedaDevice objects, or undefined if no devices are found.
 */
export async function loadLedaDevices(): Promise<LedaDevice[] | undefined> {
  const config = vscode.workspace.getConfiguration('automotive-app-deployment');
  const devices = config.get<Array<LedaDevice>>('devices');
  return devices;
}

/**
 * Creates path reference to a specified resource in the workspace
 * @param resourceUri relative path of a workspace resource
 * @returns absolute path of the workspace resource
 */
export function getExtensionResourcePath(resourceUri: string): string {
  const WORKSPACE_DIR = vscode.workspace.workspaceFolders![0].uri;
  return vscode.Uri.joinPath(WORKSPACE_DIR, resourceUri).fsPath;
}

/**
 * Save a new Leda device to the configuration.
 * @param newDevice The LedaDevice object to be saved.
 */
export async function saveLedaDevice(newDevice: LedaDevice) {
  const config = vscode.workspace.getConfiguration('automotive-app-deployment');
  const devices = config.get<Array<LedaDevice>>('devices');
  if (devices) {
    const index = devices?.findIndex((device) => device.name === newDevice.name);
    if (index !== undefined && index !== -1) {
      devices[index] = newDevice;
    } else {
      devices.push(newDevice);
    }
    await config.update('devices', devices);
  }
}

/**
 * Remove a Leda device from the configuration.
 * @param targetDevice The LedaDevice object to be removed.
 */
export async function removeLedaDevice(targetDevice: LedaDevice) {
  const config = vscode.workspace.getConfiguration('automotive-app-deployment');
  const devices = config.get<Array<LedaDevice>>('devices');
  if (devices) {
    const index = devices?.findIndex((device) => device.name === targetDevice.name);
    if (index !== undefined && index !== -1) {
      devices.splice(index, 1);
      await config.update('devices', devices);
    }
  }
}

/**
 * Read the content of a file asynchronously.
 * @param filePath The path to the file to be read.
 * @returns A Promise that resolves to the content of the file as a string.
 */
export function readFileAsync(filePath: string): any {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Delete a temporary file.
 * @param filePath The path to the temporary file to be deleted.
 * @returns A Promise that resolves when the file is successfully deleted.
 */
export async function deleteTmpFile(filePath: string): Promise<void> {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw new GenericInternalError(`Internal Error - Could not delete tmp file under "${filePath}". > SYSTEM: ${err.message}`);
    }
  });
}

/**
 * Execute a shell command and capture the output.
 * @param command The shell command to be executed.
 * @returns A Promise that resolves to the stdout of the command as a string.
 */
export async function executeShellCmd(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        resolve(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
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
  try {
    const filename = getExtensionResourcePath(localPath);
    https.get(url, (res) => {
      const fileStream = fs.createWriteStream(filename);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        chan.appendLine(`Download finished for file: "${path.basename(url)}".`);
      });
    });
    chan.appendLine(`Saved file as: "${filename}"`);
    return filename;
  } catch (err) {
    chan.appendLine(`${err}`);
    throw new GenericInternalError(`Internal Error - Failed to read from URL: "${url}". > SYSTEM: ${err}`);
  }
}
