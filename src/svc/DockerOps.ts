import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig } from '../provider/GitConfig';
import { executeDockerCmd } from '../helpers/helpers';

const TARBALL_OUTPUT_PATH = '.vscode/tmp';

export class DockerOps {

    public async buildDockerImage(chan: vscode.OutputChannel): Promise<string> {
      
      const dockerfilePathAbs = path.resolve(__dirname, '../../', `${GitConfig.DOCKERFILE}`);

      if(!fs.existsSync(dockerfilePathAbs)) {
          chan.appendLine(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`)
          throw new Error(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`)
      }
      chan.appendLine(`Found Dockerfile in ${GitConfig.DOCKERFILE}`);
      chan.appendLine('Building image...');
      
      const version = 'extension-build-local'
      const tag = `${GitConfig.CONTAINER_REGISTRY}/${GitConfig.ORG}/${GitConfig.REPO}/${GitConfig.PACKAGE}:${version}`;
      try {
          const result = await executeDockerCmd(`docker build -t ${tag} -f ${dockerfilePathAbs} .`);
          chan.appendLine(result);
          return tag
      } catch (error) {
          chan.appendLine('Error while building image...');
          throw new Error(`Error while building image: ${error}`);
      }
    }

    public async exportImageAsTarball(tag: string, chan: vscode.OutputChannel): Promise<string> {
        const relTarPath = `${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`;
        const outputTar = path.resolve(__dirname, '../../', `${relTarPath}`);
        try {
          const result = await executeDockerCmd(`docker save ${tag} > ${outputTar} `);
          chan.appendLine(result);
          chan.appendLine(`Exported image as tarball to ${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`);
          return relTarPath;
        } catch(error) {
          chan.appendLine('Error while exporting image to tar...');
          throw new Error(`Error while exporting image: ${error}`);
        }
    }

    public async importTarToContainerD() {
        //ctr image tag example.com/iximiuz/test:latest localhost:5000/iximiuz/test:latest
    }
}