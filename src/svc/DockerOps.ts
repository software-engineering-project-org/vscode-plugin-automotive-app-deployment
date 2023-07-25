import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig } from '../provider/GitConfig';
import { executeShellCmd } from '../helpers/helpers';
import { CONTAINER_REGISTRY, TARBALL_OUTPUT_PATH } from '../setup/cmdProperties';

export class DockerOps {
  /**
   * Builds a Docker image using the Dockerfile specified in the GitConfig.
   *
   * @param chan - The output channel to display build progress and results.
   * @returns A Promise that resolves to the tag of the built Docker image.
   * @throws Error if the Dockerfile is not found or an error occurs during the build process.
   */
  public async buildDockerImage(chan: vscode.OutputChannel): Promise<string> {
    // Get the absolute path of the Dockerfile based on the GitConfig settings.
    const dockerfilePathAbs = path.resolve(__dirname, '../../', `${GitConfig.DOCKERFILE}`);

    // Check if the Dockerfile exists at the specified path.
    if (!fs.existsSync(dockerfilePathAbs)) {
      chan.appendLine(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`);
      throw new Error(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`);
    }
    chan.appendLine(`Found Dockerfile in ${GitConfig.DOCKERFILE}`);
    chan.appendLine('Building image...');

    // Generate a version string based on the current date and time.
    const d = new Date();
    const version = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;

    // Specify the platform, tag, and full tag for the built Docker image.
    const platform = 'linux/arm64';
    const tag = `${GitConfig.ORG}/${GitConfig.REPO}/${GitConfig.PACKAGE}:${version}`;

    try {
      // Execute the Docker build command to build the image.
      const result = await executeShellCmd(`cd ${path.resolve(__dirname, '../../', './app')} && docker build --platform ${platform} -t ${CONTAINER_REGISTRY.ghcr}/${tag} .`);
      chan.appendLine(result);
      return tag; // Return the tag of the built Docker image.
    } catch (error) {
      chan.appendLine(`${error}`);
      throw new Error(`Error while building image - view Log`);
    }
  }

  /**
   * Exports a Docker image with the specified tag as a tarball.
   *
   * @param tag - The tag of the Docker image to export.
   * @param chan - The output channel to display progress and results.
   * @returns A Promise that resolves to the relative path of the exported tarball.
   * @throws Error if an error occurs during the export process.
   */
  public async exportImageAsTarball(tag: string, chan: vscode.OutputChannel): Promise<string> {
    // Specify the relative path for the tarball based on the GitConfig settings.
    const relTarPath = `${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`;
    const outputTar = path.resolve(__dirname, '../../', `${relTarPath}`);

    try {
      // Execute the Docker save command to export the image as a tarball.
      const result = await executeShellCmd(`docker save ${tag} > ${outputTar}`);
      chan.appendLine(result);
      chan.appendLine(`Exported image as tarball to ${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`);
      return relTarPath; // Return the relative path of the exported tarball.
    } catch (error) {
      chan.appendLine('Error while exporting image to tar...');
      throw new Error(`Error while exporting image: ${error}`);
    }
  }
}
