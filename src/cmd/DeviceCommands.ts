import * as vscode from 'vscode';
import {
  DeviceDataProvider,
  LedaDeviceTreeItem,
} from '../provider/DeviceDataProvider';
import {
  saveLedaDevice,
  removeLedaDevice,
  loadLedaDevices,
} from '../helpers/helpers';
import { LedaDevice } from '../interfaces/LedaDevice';
import { LedaDeviceQuickPickItem } from '../interfaces/QuickPickItem';

export async function addDevice(deviceDataProvider: DeviceDataProvider) {
  /**
   * set name
   */
  const name = await vscode.window.showInputBox({
    prompt: 'Device name',
    placeHolder: 'Waveshare Jetracer',
  });
  if (!name) {
    return;
  }

  /**
   * Set ip
   */
  let ip = await vscode.window.showInputBox({
    prompt: 'IP: ',
    placeHolder: '192.168.0.7',
    validateInput: (text) => {
      return validateIPaddress(text) ? null : 'No valid IP Address';
    },
  });
  if (!ip) {
    return;
  }

  /**
   * Set sshPort
   */
  let sshPortStr = await vscode.window.showInputBox({
    prompt: 'SSH-Port: ',
    placeHolder: '22',
  });
  if (!sshPortStr) {
    sshPortStr = '22';
  }
  let sshPort = Number(sshPortStr);

  /**
   * Set sshUsername
   */
  let sshUsername = await vscode.window.showInputBox({
    prompt: 'SSH-Username: ',
    placeHolder: 'root',
  });
  if (!sshUsername) {
    return;
  }

  /**
   * Save new Device
   */
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

export async function deleteDevice(
  deviceDataProvider: DeviceDataProvider,
  item: LedaDeviceTreeItem
) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

  const deviceName = device?.name;
  const result = await vscode.window.showWarningMessage(
    `Are you sure you want to delete profile: ${deviceName} ?`,
    {
      modal: true,
    },
    'Yes',
    'No'
  );

  if (!result || result === 'No') {
    return;
  }

  await removeLedaDevice(device);
  deviceDataProvider.update();
}

function validateIPaddress(ipAddress: string) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ipAddress)) {
    return true;
  }
  return false;
}

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
      })
    );
    return deviceName;
  }
}
