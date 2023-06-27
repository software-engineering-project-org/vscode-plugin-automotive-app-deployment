import {NodeSSH} from 'node-ssh';
import * as path from 'path';
import { JSONPath } from 'jsonpath-plus';
import { readFileAsync, deleteTmpFile } from '../helpers/helpers';
import * as vscode from 'vscode';
import { GitConfig } from '../provider/GitConfig';

export class ServiceSsh {
    private sshHost: string;
    private sshUsername: string; 
    private sshPort: number;
    private sshPassword: string;
    private ssh: NodeSSH;
    private kantoConfigFile: string = "/etc/container-management/config.json"
/**
 * Create a new instance of ServiceSsh.
 * @param sshHost - Remote sshd server
 * @param sshUsername - User to connect
 * @param sshPort - the port your ssh server is listening on
 */
  constructor(sshHost: string, sshUsername: string, sshPort: number, sshPassword: string) {
    this.sshHost = sshHost;
    this.sshUsername = sshUsername;
    this.sshPort = sshPort;
    this.sshPassword = sshPassword;
    this.ssh = new NodeSSH();
  }

  /**
   * Setup the connection to the SSH server defined.
   */
  public async initializeSsh(chan: vscode.OutputChannel) {
    try {
      chan.appendLine(`Establishing SSH connection: ssh ${this.sshUsername}@${this.sshHost}:${this.sshPort}`)

      await this.ssh.connect({
        port: this.sshPort,
        host: this.sshHost,
        username: this.sshUsername,
        password: this.sshPassword
    });
    } catch(e) {
        chan.appendLine(`${e}`);
    }
  }

  public async closeConn() {
    this.ssh.dispose();
  }

  /**
   * The generated resource will be copied via ssh to remote host (leda)
   * @param localManifestFile - location of manifest file to copy to remote
   */
  public async copyResourceToLeda(local: string, remote: string, chan: vscode.OutputChannel) {
    try {
        await this.ssh.putFiles([{ 
            local: path.resolve(__dirname, '../../', local), 
            remote: `${remote}` 
        }]);
        chan.appendLine(`Copied:\t\t\t Dest - ${remote} - on Remote!`);
    } catch(e) {
        chan.appendLine(`${e}`);
        throw new Error(`Error connecting to device: ${this.sshHost} -> ${(e as Error).message}`)
    }
  }


  public async getConfigFromLedaDevice(tmpConfig: string, chan: vscode.OutputChannel) {
    try {
      await this.ssh.getFile(
        path.resolve(__dirname, '../../', tmpConfig), 
        this.kantoConfigFile
      );

      chan.appendLine(`Fetch Config:\t\t Found file at - ${this.kantoConfigFile} - Checking config...`);
    }
    catch(e) {
      chan.appendLine(`${e}`);
      throw new Error(`Error reading kanto conf -> ${(e as Error).message}`)
    }
  }

  public async loadAndCheckConfigJson(configPath: string, key: string, chan: vscode.OutputChannel) {
    try {
      const fileContents = await readFileAsync(path.resolve(__dirname, '../../', configPath));
      const configJson = JSON.parse(fileContents);
      const keys = JSONPath({ path: key, json: configJson });
  
      if (keys.length === 0) {
        throw new Error(`Stage requires key: ${key} to be set in ${configPath}`);
      } else {
        chan.appendLine(`Check Config:\t\t Successful -> ${key} exists.`);
      }
    } catch (error) {
        chan.appendLine(`${error}`);
        throw new Error(`Error reading config JSON file: ${error}`);
    } finally {
        await deleteTmpFile(path.resolve(__dirname, '../../', configPath));
    }
  }

  public async containerdOps(tag: string, chan: vscode.OutputChannel): Promise<string> {
    try {
      // Import image
      let res = await this.ssh.execCommand(`ctr image import ${GitConfig.PACKAGE}.tar`, { cwd: '/tmp'});
      this.checkStdErr(res.stderr);
      chan.appendLine(res.stdout);

      // Tag image with local registry prefix 
      res = await this.ssh.execCommand(`ctr image tag ${GitConfig.CONTAINER_REGISTRY}/${tag} ${GitConfig.LOCAL_KANTO_REGISTRY}/${tag}`);
      this.checkStdErr(res.stderr);
      chan.appendLine(res.stdout);

      // Push image to local registry 
      res = await this.ssh.execCommand(`ctr image push ${GitConfig.LOCAL_KANTO_REGISTRY}/${tag}`);
      this.checkStdErr(res.stderr);
      chan.appendLine(res.stdout);

    } catch(error) {
      chan.appendLine(`${error}`);
    } finally {
        await deleteTmpFile(path.resolve(__dirname, '../../', `${GitConfig.TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`));
        return `${GitConfig.LOCAL_KANTO_REGISTRY}/${tag}`;
    }

  }

  private checkStdErr(stderr: string) {
    if(stderr != ""){
      throw Error(stderr);
    }
  }

}


