import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig } from '../provider/GitConfig';

const TARBALL_OUTPUT_PATH = '.vscode/tmp';

export class DockerOps {

    public async buildDockerImage(chan: vscode.OutputChannel) {
        if(!fs.existsSync(path.resolve(__dirname, '../../', `${GitConfig.DOCKERFILE}`))) {
            chan.appendLine(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`)
            throw new Error(`Could not find Dockerfile under ${GitConfig.DOCKERFILE}`)
        }
        chan.appendLine(`Found Dockerfile in ${GitConfig.DOCKERFILE}`)
        //Check if Docker image path exists? 
    }

    public async exportImageAsTarball(chan: vscode.OutputChannel) {
        chan.appendLine(`Exported image as tarball to ${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`);
    }

    public async getUniqueImageName(chan: vscode.OutputChannel) {
        //Tar entpacken und index.json einlesen
    }
}