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
import { DeviceDataProvider, LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { saveLedaDevice, removeLedaDevice, loadLedaDevices } from '../helpers/helpers';
import { LedaDevice } from '../interfaces/LedaDevice';
import { LedaDeviceQuickPickItem } from '../interfaces/QuickPickItem';

/**
 * Add a new Leda device to the configuration.
 * @param deviceDataProvider The DeviceDataProvider instance used to update the tree view.
 */
export async function addDevice(deviceDataProvider: DeviceDataProvider) {
  // Set name.
  const name = await vscode.window.showInputBox({
    prompt: 'Device name: ',
    placeHolder: 'Waveshare Jetracer',
  });
  if (!name) {
    return;
  }

  // Set IP.
  let ip = await vscode.window.showInputBox({
    prompt: 'IP: ',
    placeHolder: '192.168.0.7',
    validateInput: (text) => {
      return isValidIp(text) ? null : 'No valid IP Address.';
    },
  });
  if (!ip) {
    return;
  }

  // Set SSH port.
  let sshPortStr = await vscode.window.showInputBox({
    prompt: 'SSH-Port: ',
    placeHolder: '22',
    validateInput: (text) => {
      return isValidPort(text) ? null : 'No valid port specification. Define an integer in range 0 - 65535.';
    },
  });
  if (!sshPortStr) {
    sshPortStr = '22';
  }
  let sshPort = Number(sshPortStr);

  // Set SSH username.
  let sshUsername = await vscode.window.showInputBox({
    prompt: 'SSH-Username: ',
    placeHolder: 'root',
  });
  if (!sshUsername) {
    return;
  }

  // Save new device.
  await saveLedaDevice({
    name,
    ip,
    sshPort,
    sshUsername,
    sshPassword: 'pfannkuchen123',
    sshPrivateKeyPath: '/path/to/id_rsa',
    sshPublicKeyPath: '/path/to/id_rsa.pub',
  });

  deviceDataProvider.update();
}

/**
 * Delete a Leda device from the configuration.
 * @param deviceDataProvider The DeviceDataProvider instance used to update the tree view.
 * @param item The LedaDeviceTreeItem representing the device to be deleted (optional, can be null).
 */
export async function deleteDevice(deviceDataProvider: DeviceDataProvider, item: LedaDeviceTreeItem) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

  const deviceName = device?.name;
  const result = await vscode.window.showWarningMessage(
    `Are you sure you want to delete the profile: ${deviceName} ?`,
    {
      modal: true,
    },
    'Yes',
    'No',
  );

  if (!result || result === 'No') {
    return;
  }

  await removeLedaDevice(device);
  deviceDataProvider.update();
}

/**
 * Show a QuickPick dialog to select a target Leda device.
 * @returns A Promise that resolves to the selected LedaDevice or undefined if no devices are available.
 */
export async function getTargetDeviceWithQuickPick() {
  const devices = await loadLedaDevices();
  if (devices) {
    const deviceName = await vscode.window.showQuickPick(
      devices.map((device) => {
        return {
          label: device.name,
          description: '',
          detail: `Host: ${device.ip} Port: ${device.sshPort}`,
          ...device,
        } as LedaDeviceQuickPickItem;
      }),
    );
    return deviceName;
  }
}

/**
 * Helper to validate an IP address format.
 * @param ipAddress The IP address to be validated.
 * @returns true if the IP address is valid, false otherwise.
 */
function isValidIp(ipAddress: string) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ipAddress)) {
    return true;
  }
  return false;
}

/**
 * Helper to validate a port number.
 * @param port The port number to be validated.
 * @returns true if the port number is valid, false otherwise.
 */
function isValidPort(port: string) {
  // Convert the input port to a number and check if it's a valid number
  const portNumber = parseInt(port, 10);
  const HIGHPORT = 65535;
  if (Number.isNaN(portNumber) || portNumber < 1 || portNumber > HIGHPORT) {
    return false;
  }
  return true;
}
