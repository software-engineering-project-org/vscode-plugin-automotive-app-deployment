import * as vscode from 'vscode';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { getTargetDeviceWithQuickPick } from './DeviceCommands';
import { LedaDevice } from '../interfaces/LedaDevice';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';

export async function deployApplication(item: LedaDeviceTreeItem) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

  const deployerStage1 = new ManifestGeneratorJson(
    "/mnt/c/Users/POET038/VSCode/vscode-plugin-automotive-app-deployment/templates/kanto_container_conf_template.json",
    "/mnt/c/Users/POET038/VSCode/vscode-plugin-automotive-app-deployment/tmp/out.json"
    )

  deployerStage1.generateKantoContainerManifest(
    {
      'image.name': 'ghcr.io/sampleapp/test:latest'
    }
  )

  vscode.window.showInformationMessage(`Deploying to ${device.name}`);
}