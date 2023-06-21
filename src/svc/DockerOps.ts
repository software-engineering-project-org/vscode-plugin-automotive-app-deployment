import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig } from '../provider/GitConfig';
import { exec } from 'child_process';

const TARBALL_OUTPUT_PATH = '.vscode/tmp';

export class DockerOps {

    public async buildDockerImage(chan: vscode.OutputChannel): Promise<string> {
        if(!fs.existsSync(path.resolve(__dirname, '../../', `${GitConfig.DOCKERFILE}`))) {
            chan.appendLine(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`)
            throw new Error(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`)
        }
        chan.appendLine(`Found Dockerfile in ${GitConfig.DOCKERFILE}`);
        chan.appendLine('Building image...');
        const tag = "";
        try {
            const result = await this.executeDockerCmd(`kubectl get po -n infrastructure`);
            chan.appendLine(result);
            return tag
        } catch (error) {
            chan.appendLine('Error while building image...');
            throw new Error(`Error while building image: ${error}`);
        }
    }

    public async exportImageAsTarball(chan: vscode.OutputChannel) {
        chan.appendLine(`Exported image as tarball to ${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`);
    }

    public async getUniqueImageName(chan: vscode.OutputChannel) {
        //Tar entpacken und index.json einlesen
    }

    private async executeDockerCmd(command: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          exec(command, (error, stdout) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });
    }
}