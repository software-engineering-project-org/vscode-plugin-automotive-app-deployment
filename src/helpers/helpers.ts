import { LedaDevice } from "../interfaces/LedaDevice";
import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';


export async function loadLedaDevices(): Promise<
LedaDevice[] | undefined
> {
  const config = await vscode.workspace.getConfiguration("automotive-app-deployment");
  const devices = await config.get<Array<LedaDevice>>(
    "devices"
  );
  return devices;
}

/**
 * 
 * @param newDevice 
 */
export async function saveLedaDevice(newDevice: LedaDevice) {
  const config = await vscode.workspace.getConfiguration("automotive-app-deployment");
  const devices = await config.get<Array<LedaDevice>>(
    "devices"
  );
  if (devices) {
    const index = devices?.findIndex(
      (device) => device.name === newDevice.name
    );
    if (index !== undefined && index !== -1) {
        devices[index] = newDevice;
    } else {
        devices.push(newDevice);
    }
    await config.update("devices", devices);
  }
}

/**
 * 
 * @param targetDevice 
 */
export async function removeLedaDevice(targetDevice: LedaDevice) {
  const config = await vscode.workspace.getConfiguration("automotive-app-deployment");
  const devices = await config.get<Array<LedaDevice>>(
    "devices"
  );
  if (devices) {
    const index = devices?.findIndex(
      (device) => device.name === targetDevice.name
    );
    if (index !== undefined && index !== -1) {
        devices.splice(index, 1);
      await config.update("devices", devices);
    }
  }
}

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

export async function deleteTmpFile(filePath: string): Promise<void> {
  fs.unlink(filePath, (err => {
    if (err) {
      throw new Error(`Could not delete tmp file: ${err}`);
    }
  }));
}

export async function executeDockerCmd(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if(stderr){
        resolve(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

