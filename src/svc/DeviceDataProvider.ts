import * as vscode from "vscode";
import { LedaDevice } from "../interfaces/LedaDevice";
import { loadLedaDevices } from "../helpers/helpers";

export class DeviceDataProvider implements vscode.TreeDataProvider<LedaDeviceTreeItem> {
   
  private _onDidChangeTreeData: vscode.EventEmitter<
  LedaDeviceTreeItem | undefined | void
> = new vscode.EventEmitter<LedaDeviceTreeItem | undefined | void>()
readonly onDidChangeTreeData: vscode.Event<
LedaDeviceTreeItem | undefined | null | void
> = this._onDidChangeTreeData.event

update() {
  this._onDidChangeTreeData.fire();
}

getTreeItem(element: LedaDeviceTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
}

async getChildren(
  element?: LedaDeviceTreeItem
  ): Promise<LedaDeviceTreeItem[] | undefined> {
  try {
      const devices = await loadLedaDevices()
      if (devices) {
        const deviceProfiles = devices.map((device) => {
          return new LedaDeviceTreeItem(device.name, device)
        })
        return Promise.resolve(deviceProfiles)
      }
    } catch (error) {
      return Promise.reject([])
    }
}
}
  
export class LedaDeviceTreeItem extends vscode.TreeItem {
    constructor(
      public readonly label: string,
      public readonly ledaDevice: LedaDevice
    ) {
      super(label)
    }
  }
