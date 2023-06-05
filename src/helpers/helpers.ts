import { LedaDevice } from "../interfaces/LedaDevice";
import * as vscode from 'vscode';


export async function loadLedaDevices(): Promise<
LedaDevice[] | undefined
> {
  const config = await vscode.workspace.getConfiguration("leda-app-deployer")
  const devices = await config.get<Array<LedaDevice>>(
    "devices"
  )
  return devices
}

/**
 * 
 * @param newDevice 
 */
export async function saveLedaDevice(newDevice: LedaDevice) {
  const config = await vscode.workspace.getConfiguration("leda-app-deployer")
  const devices = await config.get<Array<LedaDevice>>(
    "devices"
  )
  if (devices) {
    const index = devices?.findIndex(
      (device) => device.name === newDevice.name
    )
    if (index !== undefined && index !== -1) {
        devices[index] = newDevice
    } else {
        devices.push(newDevice)
    }
    await config.update("devices", devices)
  }
}

/**
 * 
 * @param targetDevice 
 */
export async function removeLedaDevice(targetDevice: LedaDevice) {
  const config = await vscode.workspace.getConfiguration("leda-app-deployer")
  const devices = await config.get<Array<LedaDevice>>(
    "devices"
  )
  if (devices) {
    const index = devices?.findIndex(
      (device) => device.name === targetDevice.name
    )
    if (index !== undefined && index !== -1) {
        devices.splice(index, 1)
      await config.update("devices", devices)
    }
  }
}