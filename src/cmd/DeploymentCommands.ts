import * as vscode from 'vscode';
import * as path from 'path';
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
import { checkAndHandleTarSource } from '../helpers/helpers';

const TMP_KANTO_CONFIG_PATH = '.vscode/tmp/config.json';
const KANTO_CONFIG_REMOTE_REG_JSON_PATH = 'containers.registry_configurations["ghcr.io"]';
const KANTO_CONFIG_LOCAL_REG_JSON_PATH = 'containers.insecure-registries';
const TEMPLATE_FILE_PATH = '.vscode/templates/kanto_container_conf_template.json';
const OUTPUT_FILE_PATH = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';
const MANIFEST_DIR = "/data/var/containers/manifests";

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

    //Create output channel for user
    let stage01 = vscode.window.createOutputChannel("LAD Remote");
    stage01.show()
    stage01.appendLine("Starting remote build and deployment...")

  /**
   * STEP 3
   */

  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
  await serviceSsh.initializeSsh(stage01);
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage01);
  await serviceSsh.loadAndCheckConfigJson(TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_REMOTE_REG_JSON_PATH, stage01);

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
    generator.generateKantoContainerManifest(keyValuePairs, stage01);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 5
   */
  await serviceSsh.copyResourceToLeda(path.resolve(__dirname, '../../', OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${GitConfig.PACKAGE}.json`, stage01);
  await serviceSsh.closeConn();

  stage01.appendLine(`Deploying to Leda:\t ${packageVersion.image_name_sha}`)
  vscode.window.showInformationMessage(`Deployed to ${device.name}`);
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


  // Init 
  let stage02 = vscode.window.createOutputChannel("LAD Hybrid");
  stage02.show()
  stage02.appendLine("Starting hybrid build and deployment...")

  /**
   * STEP 1 & 2
   */
  await GitConfig.init();

  /**
  * STEP 3
  */

  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
  await serviceSsh.initializeSsh(stage02);
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage02);
  await serviceSsh.loadAndCheckConfigJson(TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH, stage02);

  /**
   * STEP 4
   */
  const tarSource = await vscode.window.showInputBox({
    prompt: "Image source",
    placeHolder: "URL or File path"
  });
  if (!tarSource) {
    return;
  }

  const outputTarPath = await checkAndHandleTarSource(tarSource, stage02);

  /**
   * STEP 5
   */
  await serviceSsh.copyResourceToLeda(outputTarPath, `/tmp/${GitConfig.PACKAGE}.tar`, stage02);
  
    /**
   * STEP 6
   */
  const localRegTag = await serviceSsh.containerdOps("", stage02);

  /**
 * STEP 7
 */
  const generator = new ManifestGeneratorJson(TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH);

  const keyValuePairs = {
    'id': GitConfig.PACKAGE,
    'name': GitConfig.PACKAGE,
    'image.name': localRegTag
  };

  await new Promise(resolve => {
    generator.generateKantoContainerManifest(keyValuePairs, stage02);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 8
   */
  await serviceSsh.copyResourceToLeda(path.resolve(__dirname, '../../', OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${GitConfig.PACKAGE}.json`, stage02);
  await serviceSsh.closeConn();

  stage02.appendLine(`Deploying to Leda:\t `)
  vscode.window.showInformationMessage(`Deployed to ${device.name}`);
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
  let stage03 = vscode.window.createOutputChannel("LAD Local");
  stage03.show()
  stage03.appendLine("Starting local build and deployment...")

  /**
   * STEP 1 & 2
   */

  const dockerOps = new DockerOps();
  const tag = await dockerOps.buildDockerImage(stage03);

  /**
   * STEP 3
   */
  const tar = await dockerOps.exportImageAsTarball(`${GitConfig.CONTAINER_REGISTRY}/${tag}`, stage03);

  /**
   * STEP 4
   */
  const serviceSsh = new ServiceSsh(device.ip, device.sshUsername, device.sshPort, device.sshPassword!);
  await serviceSsh.initializeSsh(stage03);
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage03);
  await serviceSsh.loadAndCheckConfigJson(TMP_KANTO_CONFIG_PATH, KANTO_CONFIG_LOCAL_REG_JSON_PATH, stage03);

  /**
   * STEP 5
   */
  await serviceSsh.copyResourceToLeda(path.resolve(__dirname, '../../', tar), `/tmp/${GitConfig.PACKAGE}.tar`, stage03);

  /**
   * STEP 6
   */
  const localRegTag = await serviceSsh.containerdOps(`${tag}`, stage03)

  /**
   * STEP 7
   */
  const generator = new ManifestGeneratorJson(TEMPLATE_FILE_PATH, OUTPUT_FILE_PATH);

  const keyValuePairs = {
    'id': GitConfig.PACKAGE,
    'name': GitConfig.PACKAGE,
    'image.name': localRegTag
  };

  await new Promise(resolve => {
    generator.generateKantoContainerManifest(keyValuePairs, stage03);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 8
   */
  await serviceSsh.copyResourceToLeda(path.resolve(__dirname, '../../', OUTPUT_FILE_PATH), `${MANIFEST_DIR}/${GitConfig.PACKAGE}.json`, stage03);
  await serviceSsh.closeConn();


/**
 * 1. Pfad zum Dockerfile angeben (vorhanden?)
 * 2. Image lokal bauen (Check Dockerfiel da)
 * 3. Exportieren als Tarball (nach .vscode/tmp/*.tar)
 * 4. Kanto Config -> local-registries gesetzt? 
 *    - /etc/container-management/config.json
 *    - Objekt insecure-registries prüfen
 * 5. Tarball via SCP nach Leda Device
 * 6. Ausführen des containerd commands
 * 7. Einfügen des Strings (index.json) ins Manifest
 * 8. Gesichertes Manifest via SCP auf Leda Device kopieren
 */

  stage03.appendLine(`Deploying to Leda:\t ${localRegTag}`)
  vscode.window.showInformationMessage(`Deployed to ${device.name}`);
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