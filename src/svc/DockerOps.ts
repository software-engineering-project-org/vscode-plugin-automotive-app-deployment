/**
 * Copyright (c) 2023 Contributors to the Eclipse Foundation
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig } from '../provider/GitConfig';
import { executeShellCmd } from '../helpers/helpers';
import { CONTAINER_REGISTRY, TARBALL_OUTPUT_PATH, TARGET_CONTAINER_PLATFORM } from '../setup/cmdProperties';
import { DockerBuildFailedError, DockerExportImageError, DockerfileNotFoundError, GenericInternalError, logToChannelAndErrorConsole } from '../error/customErrors';

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
      throw logToChannelAndErrorConsole(
        chan, 
        new DockerfileNotFoundError(new GenericInternalError(GitConfig.DOCKERFILE)), 
      )
    }
    chan.appendLine(`Found Dockerfile in ${GitConfig.DOCKERFILE}`);
    chan.appendLine('Building image...');

    // Generate a version string based on the current date and time.
    const d = new Date();
    const version = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;

    // Specify the platform, tag, and full tag for the built Docker image.
    const tag = `${GitConfig.ORG}/${GitConfig.REPO}/${GitConfig.PACKAGE}:${version}`;

    try {
      // Execute the Docker build command to build the image.
      const result = await executeShellCmd(`cd ${path.resolve(__dirname, '../../', './app')} && docker build --platform ${TARGET_CONTAINER_PLATFORM} -t ${CONTAINER_REGISTRY.ghcr}/${tag} .`);
      chan.appendLine(result);
      return tag; // Return the tag of the built Docker image.
    } catch (err) {
      throw logToChannelAndErrorConsole(
        chan, 
        new DockerBuildFailedError(err as Error)
      );
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
    } catch (err) {
      logToChannelAndErrorConsole(
        chan, 
        new DockerExportImageError(err as Error),
      )
    }
  }
}
