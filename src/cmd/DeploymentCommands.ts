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
import { GitConfig } from '../provider/GitConfig';
import { DockerOps } from '../svc/DockerOps';

const TMP_KANTO_CONFIG_PATH = '.vscode/tmp/config.json';
const KANTO_CONFIG_REMOTE_REG_JSON_PATH = 'containers.registry_configurations["ghcr.io"]';
const KANTO_CONFIG_LOCAL_REG_JSON_PATH = 'containers.insecure-registries';
const TEMPLATE_FILE_PATH = '.vscode/templates/kanto_container_conf_template.json';
const OUTPUT_FILE_PATH = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';

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
  await GitConfig.init();
  const packageVersion = await getVersionsWithQuickPick(octokit) as PackageVersion;

  /**
   * STEP 3
   */

  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort);
  await serviceSsh.initializeSsh();
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH);
  await serviceSsh.loadAndCheckConfigJson(TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_REMOTE_REG_JSON_PATH);

  /**
   * STEP 4
   */
  const generator = new ManifestGeneratorJson(TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH);

  const keyValuePairs = {
    'id': GitConfig.PACKAGE,
    'name': GitConfig.PACKAGE,
    'image.name': `${GitConfig.CONTAINER_REGISTRY}/${GitConfig.ORG}/${GitConfig.REPO}/${GitConfig.PACKAGE}@${packageVersion.image_name_sha}`
  };

  await new Promise(resolve => {
    generator.generateKantoContainerManifest(keyValuePairs);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 5
   */
  await serviceSsh.copyKantoManifestToLeda(OUTPUT_FILE_PATH);

  console.log(`Deploying to Leda:\t ${packageVersion.image_name_sha}`)
  vscode.window.showInformationMessage(`Deployed ${GitConfig.PACKAGE} to ${device.name}`);
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
  await GitConfig.init();
  const packageVersion = await getVersionsWithQuickPick(octokit) as PackageVersion;

  /**
  * STEP 3
  */

  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort);
  await serviceSsh.initializeSsh();
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH);
  await serviceSsh.loadAndCheckConfigJson(TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH);

  /**
   * STEP 4
   */

  console.log(`Deploying to Leda:\t ${packageVersion.image_name_sha}`)
  vscode.window.showInformationMessage(`Deployed ${GitConfig.PACKAGE} to ${device.name}`);
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

  //Init
  await GitConfig.init();

  //Create output channel for user
  let stage03 = vscode.window.createOutputChannel("LAD");
  stage03.show()
  stage03.appendLine("Starting local build and deployment...")

  /**
   * STEP 1 & 2
   */

  const dockerOps = new DockerOps();
  await dockerOps.buildDockerImage(stage03);

  /**
   * STEP 3
   */
  await dockerOps.exportImageAsTarball(stage03);


/**
 * 1. Pfad zum Dockerfile angeben (vorhanden?)
 * 2. Image lokal bauen (Check Dockerfiel da)
 * 3. Exportieren als Tarball (nach .vscode/tmp/*.tar)
 * 4. Kanto Config -> local-registries gesetzt? 
 *    - /etc/container-management/config.json
 *    - Objekt insecure-registries prüfen
 * 5. Tarball via SCP nach Leda Device
 * 6. Ausführen des containerd imports
 * 7. Einfügen des Strings (index.json) ins Manifest
 * 8. Gesichertes Manifest via SCP auf Leda Device kopieren
 */



  vscode.window.showInformationMessage(`Deploying to ${device.name} 03`);
}

export async function getVersionsWithQuickPick(octokit: Octokit) {
  const regOpsOrg = new RegistryOpsOrg();

  const packageVersions = await regOpsOrg.getPackageVersionsObj(octokit);
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