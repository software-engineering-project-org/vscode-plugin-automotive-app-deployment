import * as vscode from 'vscode';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { getTargetDeviceWithQuickPick } from './DeviceCommands';
import { LedaDevice } from '../interfaces/LedaDevice';


export async function deployApplication(item: LedaDeviceTreeItem) {
  let device = item?.ledaDevice
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick()
    if (quickPickResult) {
      device = quickPickResult as LedaDevice
    }
  }

  vscode.window.showInformationMessage(`Deploying to ${device.name}`)
}