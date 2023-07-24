import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig } from '../provider/GitConfig';
import { executeShellCmd } from '../helpers/helpers';

export class DockerOps {
  public async buildDockerImage(chan: vscode.OutputChannel): Promise<string> {
    const dockerfilePathAbs = path.resolve(__dirname, '../../', `${GitConfig.DOCKERFILE}`);

    if (!fs.existsSync(dockerfilePathAbs)) {
      chan.appendLine(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`);
      throw new Error(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`);
    }
    chan.appendLine(`Found Dockerfile in ${GitConfig.DOCKERFILE}`);
    chan.appendLine('Building image...');

    const d = new Date();

    const version = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
    const platform = 'linux/arm64';
    const tag = `${GitConfig.ORG}/${GitConfig.REPO}/${GitConfig.PACKAGE}:${version}`;
    try {
      const result = await executeShellCmd(`cd ${path.resolve(__dirname, '../../', './app')} && docker build --platform ${platform} -t ${GitConfig.CONTAINER_REGISTRY}/${tag} .`);
      chan.appendLine(result);
      return tag;
    } catch (error) {
      chan.appendLine(`${error}`);
      throw new Error(`Error while building image - view Log`);
    }
  }

  public async exportImageAsTarball(tag: string, chan: vscode.OutputChannel): Promise<string> {
    const relTarPath = `${GitConfig.TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`;
    const outputTar = path.resolve(__dirname, '../../', `${relTarPath}`);
    try {
      const result = await executeShellCmd(`docker save ${tag} > ${outputTar}`);
      chan.appendLine(result);
      chan.appendLine(`Exported image as tarball to ${GitConfig.TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`);
      return relTarPath;
    } catch (error) {
      chan.appendLine('Error while exporting image to tar...');
      throw new Error(`Error while exporting image: ${error}`);
    }
  }
}
