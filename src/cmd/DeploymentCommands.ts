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
import { checkAndHandleTarSource } from     '../helpers/helpers';

// Import setup constants from properties file.
import {
  TMP_KANTO_CONFIG_PATH,
  KANTO_CONFIG_REMOTE_REG_JSON_PATH,
  KANTO_CONFIG_LOCAL_REG_JSON_PATH,
  TEMPLATE_FILE_PATH,
  OUTPUT_FILE_PATH,
  MANIFEST_DIR,
} from '../setup/cmdProperties';

/**
 * ###############################################################################
 *                                  STAGE 01
 * ###############################################################################
 */

export async function deployStageOne(
  item: LedaDeviceTreeItem,
  octokit: Octokit
) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

  /**
   * 1. Overview (QuickPick): Three choices (sha, tag, latest)
   * 2. User clicks on an item from the list
   * 3. Check if GH Token is set in Kanto Config
   *    - Check the /etc/container-management/config.json file
   *    - Examine the registry_configurations object
   * 4. Generate a string and insert it into the Manifest
   * 5. Copy the secured Manifest to the Leda Device via SCP
   */

  /**
   * STEP 1 & 2
   */
  await GitConfig.init();
  const packageVersion = (await getVersionsWithQuickPick(
    octokit
  )) as PackageVersion;

  //Create output channel for user
  let stage01 = vscode.window.createOutputChannel('LAD Remote');
  stage01.show();
  stage01.appendLine('Starting remote build and deployment...');

  /**
   * STEP 3
   */
  const serviceSsh = new ServiceSsh(
    device.ip,
    device.sshUsername,
    device.sshPort,
    device.sshPassword!
  );
  await serviceSsh.initializeSsh(stage01);
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage01);
  await serviceSsh.loadAndCheckConfigJson(
    TMP_KANTO_CONFIG_PATH,
    KANTO_CONFIG_REMOTE_REG_JSON_PATH,
    stage01
  );

  /**
   * STEP 4
   */
  const generator = new ManifestGeneratorJson(
    TEMPLATE_FILE_PATH,
    OUTPUT_FILE_PATH
  );

  const keyValuePairs = {
    id: GitConfig.PACKAGE,
    name: GitConfig.PACKAGE,
    'image.name': `${GitConfig.CONTAINER_REGISTRY}/${GitConfig.ORG}/${GitConfig.REPO}/${GitConfig.PACKAGE}@${packageVersion.image_name_sha}`,
  };

  await new Promise((resolve) => {
    generator.generateKantoContainerManifest(keyValuePairs, stage01);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 5
   */
  await serviceSsh.copyResourceToLeda(
    path.resolve(__dirname, '../../', OUTPUT_FILE_PATH),
    `${MANIFEST_DIR}/${GitConfig.PACKAGE}.json`,
    stage01
  );
  await serviceSsh.closeConn();

  stage01.appendLine(`Deploying to Leda:\t ${packageVersion.image_name_sha}`);
  vscode.window.showInformationMessage(`Deployed to ${device.name}`);
}

/**
 * ###############################################################################
 *                                  STAGE 02
 * ###############################################################################
 */

export async function deployStageTwo(
  item: LedaDeviceTreeItem,
  octokit: Octokit
) {
  let device = item?.ledaDevice;
  if (!device) {
    const quickPickResult = await getTargetDeviceWithQuickPick();
    if (quickPickResult) {
      device = quickPickResult as LedaDevice;
    }
  }

  /**
   * 1. Overview (QuickPick): Three choices (sha, tag, latest)
   * 2. User clicks on an item from the list
   * 3. Check if local-registries are set in Kanto Config
   *    - Check the /etc/container-management/config.json file
   *    - Examine the insecure-registries object
   * 4. Download the selected item to the device
   * 5. Export it as a Tarball
   * 6. Copy the Tarball to the Leda Device via SCP
   * 7. Execute the containerd imports
   * 8. Insert the string (index.json) into the Manifest
   * 9. Copy the secured Manifest to the Leda Device via SCP
   */

  // Init
  let stage02 = vscode.window.createOutputChannel('LAD Hybrid');
  stage02.show();
  stage02.appendLine('Starting hybrid build and deployment...');

  /**
   * STEP 1 & 2
   */
  await GitConfig.init();

  /**
   * STEP 3
   */
  const serviceSsh = new ServiceSsh(
    device.ip,
    device.sshUsername,
    device.sshPort,
    device.sshPassword!
  );
  await serviceSsh.initializeSsh(stage02);
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage02);
  await serviceSsh.loadAndCheckConfigJson(
    TMP_KANTO_CONFIG_PATH,
    KANTO_CONFIG_LOCAL_REG_JSON_PATH,
    stage02
  );

  /**
   * STEP 4
   */
  const tarSource = await vscode.window.showInputBox({
    prompt: 'Image source',
    placeHolder: 'URL or File path',
  });
  if (!tarSource) {
    return;
  }

  const outputTarPath = await checkAndHandleTarSource(tarSource, stage02);

  /**
   * STEP 5
   */
  await serviceSsh.copyResourceToLeda(
    outputTarPath,
    `/tmp/${GitConfig.PACKAGE}.tar`,
    stage02
  );

  /**
   * STEP 6
   */
  const localRegTag = await serviceSsh.containerdOps('', stage02);

  /**
   * STEP 7
   */
  const generator = new ManifestGeneratorJson(
    TEMPLATE_FILE_PATH,
    OUTPUT_FILE_PATH
  );

  const keyValuePairs = {
    id: GitConfig.PACKAGE,
    name: GitConfig.PACKAGE,
    'image.name': localRegTag,
  };

  await new Promise((resolve) => {
    generator.generateKantoContainerManifest(keyValuePairs, stage02);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 8
   */
  await serviceSsh.copyResourceToLeda(
    path.resolve(__dirname, '../../', OUTPUT_FILE_PATH),
    `${MANIFEST_DIR}/${GitConfig.PACKAGE}.json`,
    stage02
  );
  await serviceSsh.closeConn();

  stage02.appendLine(`Deploying to Leda:\t `);
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
  let stage03 = vscode.window.createOutputChannel('LAD Local');
  stage03.show();
  stage03.appendLine('Starting local build and deployment...');

  /**
   * STEP 1 & 2
   */

  const dockerOps = new DockerOps();
  const tag = await dockerOps.buildDockerImage(stage03);

  /**
   * STEP 3
   */
  const tar = await dockerOps.exportImageAsTarball(
    `${GitConfig.CONTAINER_REGISTRY}/${tag}`,
    stage03
  );

  /**
   * STEP 4
   */
  const serviceSsh = new ServiceSsh(
    device.ip,
    device.sshUsername,
    device.sshPort,
    device.sshPassword!
  );
  await serviceSsh.initializeSsh(stage03);
  await serviceSsh.getConfigFromLedaDevice(TMP_KANTO_CONFIG_PATH, stage03);
  await serviceSsh.loadAndCheckConfigJson(
    TMP_KANTO_CONFIG_PATH,
    KANTO_CONFIG_LOCAL_REG_JSON_PATH,
    stage03
  );

  /**
   * STEP 5
   */
  await serviceSsh.copyResourceToLeda(
    path.resolve(__dirname, '../../', tar),
    `/tmp/${GitConfig.PACKAGE}.tar`,
    stage03
  );

  /**
   * STEP 6
   */
  const localRegTag = await serviceSsh.containerdOps(`${tag}`, stage03);

  /**
   * STEP 7
   */
  const generator = new ManifestGeneratorJson(
    TEMPLATE_FILE_PATH,
    OUTPUT_FILE_PATH
  );

  const keyValuePairs = {
    id: GitConfig.PACKAGE,
    name: GitConfig.PACKAGE,
    'image.name': localRegTag,
  };

  await new Promise((resolve) => {
    generator.generateKantoContainerManifest(keyValuePairs, stage03);
    setTimeout(resolve, 100); // Adjust the delay if needed
  });

  /**
   * STEP 8
   */
  await serviceSsh.copyResourceToLeda(
    path.resolve(__dirname, '../../', OUTPUT_FILE_PATH),
    `${MANIFEST_DIR}/${GitConfig.PACKAGE}.json`,
    stage03
  );
  await serviceSsh.closeConn();

  /**
   * 1. Specify the path to the Dockerfile (Is it available?)
   * 2. Build the image locally (Check if the Dockerfile is present)
   * 3. Export it as a Tarball (to .vscode/tmp/*.tar)
   * 4. Check if local-registries are set in Kanto Config
   *    - Check the /etc/container-management/config.json file
   *    - Examine the insecure-registries object
   * 5. Copy the Tarball to the Leda Device via SCP
   * 6. Execute the containerd commands
   * 7. Insert the string (index.json) into the Manifest
   * 8. Copy the secured Manifest to the Leda Device via SCP
   */

  stage03.appendLine(`Deploying to Leda:\t ${localRegTag}`);
  vscode.window.showInformationMessage(`Deployed to ${device.name}`);
}

export async function getVersionsWithQuickPick(octokit: Octokit) {
  const regOpsOrg = new RegistryOpsOrg();

  const packageVersions = await regOpsOrg.getPackageVersionsObj(octokit);
  if (packageVersions) {
    const packageVersion = await vscode.window.showQuickPick(
      packageVersions.map((packageV) => {
        let tag =
          packageV.tags.length === 0 ? 'No tag avalaible' : packageV.tags[0];
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
