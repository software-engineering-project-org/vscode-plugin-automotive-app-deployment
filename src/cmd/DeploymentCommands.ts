import * as vscode from 'vscode';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { getTargetDeviceWithQuickPick } from './DeviceCommands';
import { LedaDevice } from '../interfaces/LedaDevice';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';
import { ServiceSsh } from '../svc/ServiceSsh';

export async function deployStageOne(item: LedaDeviceTreeItem) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

/**
 * 1. Übersicht (QuickPick): Drei Auswahl (sha, tag, latest)
 * 2. User klickt Item aus Liste an 
 * 3. Kanto Config -> GH Token gesetzt? 
 *    - /etc/container-management/config.json
 *    - Objekt registry_configurations prüfen 
 * 4. String generieren und in Manifest eintragen 
 * 5. Gesichertes Manifest via SCP auf Leda Device kopieren 
 */

  /**
   * STEP 4
   */
  const templateFilePath = '.vscode/templates/kanto_container_conf_template.json';
  const outputFilePath = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';

  const generator = new ManifestGeneratorJson(templateFilePath, outputFilePath);

  const keyValuePairs = {
    'id': 'test',
    'name': 'neuerTest',
    'image.name': 'ghcr.io/test/test/sampleapp:1.0.5',
    'config.env': ['environment', 'var', 'hello'],
  };

  await new Promise(resolve => {
    generator.generateKantoContainerManifest(keyValuePairs);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 5
   */

  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort);
  await serviceSsh.copyKantoManifestToLeda(outputFilePath);


  vscode.window.showInformationMessage(`Deploying to ${device.name} 01`);
}

export async function deployStageTwo(item: LedaDeviceTreeItem) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

/**
 * 1. Übersicht (QuickPick): Drei Auswahl (sha, tag, latest)
 * 2. User klickt Item aus Liste an 
 * 3. Kanto Config -> local-registries gesetzt? 
 *    - /etc/container-management/config.json
 *    - Objekt insecure-registries prüfen 
 * 4. Download der Auswahl aufs Gerät 
 * 5. Exportieren als Tarball 
 * 6. Tarball via SCP nach Leda Device 
 * 7. Ausführen des containerd imports
 * 8. Einfügen des Strings (index.json) ins Manifest 
 * 9. Gesichertes Manifest via SCP auf Leda Device kopieren 
 */

  vscode.window.showInformationMessage(`Deploying to ${device.name} 02`);
}

export async function deployStageThree(item: LedaDeviceTreeItem) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

/**
 * 1. Pfad zum Dockerfile angeben (vorhanden?)
 * 2. Image lokal bauen 
 * 3. Kanto Config -> local-registries gesetzt? 
 *    - /etc/container-management/config.json
 *    - Objekt insecure-registries prüfen
 * 4. Exportieren als Tarball 
 * 5. Tarball via SCP nach Leda Device
 * 6. Ausführen des containerd imports
 * 7. Einfügen des Strings (index.json) ins Manifest
 * 8. Gesichertes Manifest via SCP auf Leda Device kopieren
 */

  vscode.window.showInformationMessage(`Deploying to ${device.name} 03`);
}