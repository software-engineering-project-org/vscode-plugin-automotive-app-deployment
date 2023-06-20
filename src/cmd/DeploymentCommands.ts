import * as vscode from 'vscode';
import { LedaDeviceTreeItem } from '../provider/DeviceDataProvider';
import { getTargetDeviceWithQuickPick } from './DeviceCommands';
import { LedaDevice } from '../interfaces/LedaDevice';
import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';
import { ServiceSsh } from '../svc/ServiceSsh';
import { RegistryOpsOrg } from '../svc/GitHubOps/RegistryOpsOrg';
import { PackageQuickPickItem } from '../interfaces/QuickPickItem';
import { PackageVersion } from '../interfaces/GitHubTypes';
import { Octokit } from '@octokit/rest';

const TMP_KANTO_CONFIG_PATH = '.vscode/tmp/config.json';

/**
 * ###############################################################################
 *                                  STAGE 01
 * ###############################################################################
 */

export async function deployStageOne(item: LedaDeviceTreeItem, octokit: Octokit) {
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
   * STEP 1 & 2
   */
  const manifestData = await ManifestGeneratorJson.readAppManifest("app/AppManifest.json");
  const packageVersion = await getVersionsWithQuickPick(manifestData.Name, octokit) as PackageVersion;

  /**
   * STEP 3
   */

  const configPath = TMP_KANTO_CONFIG_PATH;
  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort);
  await serviceSsh.initializeSsh();
  await serviceSsh.getConfigFromLedaDevice(configPath);
  await serviceSsh.loadAndCheckConfigJson(configPath, 'containers.registry_configurations["ghcr.io"]');

  /**
   * STEP 4
   */
  const templateFilePath = '.vscode/templates/kanto_container_conf_template.json';
  const outputFilePath = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';

  const generator = new ManifestGeneratorJson(templateFilePath, outputFilePath);

  const keyValuePairs = {
    'id': manifestData.Name,
    'name': manifestData.Name,
    'image.name': `ghcr.io/software-engineering-project-org/vehicle-app-python-template/sampleapp@${packageVersion.image_name_sha}`
  };

  await new Promise(resolve => {
    generator.generateKantoContainerManifest(keyValuePairs);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 5
   */
  await serviceSsh.copyKantoManifestToLeda(outputFilePath, manifestData.Name);

  console.log(`Deploying to Leda:\t ${packageVersion.image_name_sha}`)
  vscode.window.showInformationMessage(`Deployed ${manifestData.Name} to ${device.name}`);
}

/**
 * ###############################################################################
 *                                  STAGE 02
 * ###############################################################################
 */

export async function deployStageTwo(item: LedaDeviceTreeItem, octokit: Octokit) {
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

  /**
   * STEP 1 & 2
   */
  const manifestData = await ManifestGeneratorJson.readAppManifest("app/AppManifest.json");
  const packageVersion = await getVersionsWithQuickPick(manifestData.Name, octokit) as PackageVersion;

  /**
  * STEP 3
  */

  const configPath = TMP_KANTO_CONFIG_PATH;
  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort);
  await serviceSsh.initializeSsh();
  await serviceSsh.getConfigFromLedaDevice(configPath);
  await serviceSsh.loadAndCheckConfigJson(configPath, 'containers.insecure-registries');

  console.log(`Deploying to Leda:\t ${packageVersion.image_name_sha}`)
  vscode.window.showInformationMessage(`Deployed ${manifestData.Name} to ${device.name}`);
}

/**
 * ###############################################################################
 *                                  STAGE 03
 * ###############################################################################
 */

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

export async function getVersionsWithQuickPick(appName: string, octokit: Octokit) {
  const regOpsOrg = new RegistryOpsOrg();

  const packageVersions = await regOpsOrg.getPackageVersionsObj(appName, 'container', octokit);
    if (packageVersions) {
      const packageVersion = await vscode.window.showQuickPick(
        packageVersions.map((packageV) => {
          let tag = packageV.tags.length == 0 ? "No tag avalaible": packageV.tags[0];
          return {
            label: tag,
            description: packageV.updated_at,
            detail: packageV.image_name_sha,
            ...packageV,
          } as PackageQuickPickItem;
        })
      );
      return packageVersion;
  }
}