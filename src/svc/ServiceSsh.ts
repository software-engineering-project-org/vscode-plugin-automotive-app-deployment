import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { JSONPath } from 'jsonpath-plus';
import { readFileAsync, deleteTmpFile } from '../helpers/helpers';
import * as vscode from 'vscode';
import { GitConfig } from '../provider/GitConfig';
import { KANTO_CONFIG_FILE, CONTAINER_REGISTRY, LOCAL_KANTO_REGISTRY, TARBALL_OUTPUT_PATH } from '../setup/cmdProperties';

export class ServiceSsh {
  private sshHost: string;
  private sshUsername: string;
  private sshPort: number;
  private sshPassword: string;
  private ssh: NodeSSH;

  /**
   * Create a new instance of ServiceSsh.
   * @param {string} sshHost - Remote sshd server
   * @param {string} sshUsername - User to connect
   * @param {number} sshPort - The port your ssh server is listening on
   * @param {string} sshPassword - The password for the ssh user
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
   *
   * @param {vscode.OutputChannel} chan - The output channel to display progress and results.
   */
  public async initializeSsh(chan: vscode.OutputChannel) {
    try {
      chan.appendLine(`Establishing SSH connection: ssh ${this.sshUsername}@${this.sshHost}:${this.sshPort}`);

      await this.ssh.connect({
        port: this.sshPort,
        host: this.sshHost,
        username: this.sshUsername,
        password: this.sshPassword,
      });
    } catch (e) {
      chan.appendLine(`${e}`);
      // TODO: Throw appropriate Error to stop application from executing if connection is refused.
      // TODO: Make an error class for this.
    }
  }

  /**
   * Close the SSH connection.
   */
  public async closeConn() {
    this.ssh.dispose();
  }

  /**
   * Copy a local resource to a remote host using SSH.
   *
   * @param {string} local - The local path of the resource to copy.
   * @param {string} remote - The remote destination path to copy the resource.
   * @param {vscode.OutputChannel} chan - The output channel to display progress and results.
   */
  public async copyResourceToLeda(local: string, remote: string, chan: vscode.OutputChannel) {
    try {
      await this.ssh.putFiles([
        {
          local,
          remote,
        },
      ]);
      chan.appendLine(`Copied:\t\t\t Dest - ${remote} - on Remote!`);
    } catch (e) {
      chan.appendLine(`${e}`);
      throw new Error(`Error connecting to device: ${this.sshHost} -> ${(e as Error).message}`);
    }
  }

  /**
   * Get the configuration file from the Leda device.
   *
   * @param {string} tmpConfig - The temporary path to store the configuration file locally.
   * @param {vscode.OutputChannel} chan - The output channel to display progress and results.
   */
  public async getConfigFromLedaDevice(tmpConfig: string, chan: vscode.OutputChannel) {
    try {
      await this.ssh.getFile(path.resolve(__dirname, '../../', tmpConfig), KANTO_CONFIG_FILE);

      chan.appendLine(`Fetch Config:\t\t Found file at - ${KANTO_CONFIG_FILE} - Checking config...`);
    } catch (e) {
      chan.appendLine(`${e}`);
      // TODO: Add cutom error in error class.
      throw new Error(`Error reading kanto conf -> ${(e as Error).message}`);
    }
  }

  /**
   * Load and check the configuration JSON file.
   *
   * @param {string} configPath - The path to the configuration JSON file.
   * @param {string} key - The key to check in the configuration JSON.
   * @param {vscode.OutputChannel} chan - The output channel to display progress and results.
   */
  public async loadAndCheckConfigJson(configPath: string, key: string, chan: vscode.OutputChannel) {
    try {
      const fileContents = await readFileAsync(path.resolve(__dirname, '../../', configPath));
      const configJson = JSON.parse(fileContents);
      const keys = JSONPath({ path: key, json: configJson });

      if (keys.length === 0) {
        // TODO: Add error class
        throw new Error(`Stage requires key: ${key} to be set in ${configPath}`);
      } else {
        chan.appendLine(`Check Config:\t\t Successful -> ${key} exists.`);
      }
    } catch (error) {
      chan.appendLine(`${error}`);
      // TODO: Add error class
      throw new Error(`Error reading config JSON file: ${error}`);
    } finally {
      await deleteTmpFile(path.resolve(__dirname, '../../', configPath));
    }
  }

  /**
   * Perform container operations on the Leda device.
   *
   * @param {string} tag - The tag to use for the container image.
   * @param {vscode.OutputChannel} chan - The output channel to display progress and results.
   * @returns {Promise<string>} The container image tag used for the operations.
   */
  public async containerdOps(tag: string, chan: vscode.OutputChannel): Promise<string> {
    try {
      // Import image
      let res = await this.ssh.execCommand(`ctr image import ${GitConfig.PACKAGE}.tar`, { cwd: '/tmp' });
      this.checkStdErr(res.stderr);
      chan.appendLine(res.stdout);
      let registry = CONTAINER_REGISTRY.ghcr;

      // Tag image with local registry prefix
      if (tag === '') {
        let fullTag = res.stdout.split(' ')[1];
        tag = fullTag.substring(fullTag.indexOf('/') + 1);
        registry = CONTAINER_REGISTRY.docker;
      }

      chan.appendLine(`Tagging -> ${registry}/${tag} TO ${LOCAL_KANTO_REGISTRY}/${tag}`);

      res = await this.ssh.execCommand(`ctr image tag ${registry}/${tag} ${LOCAL_KANTO_REGISTRY}/${tag}`);
      this.checkStdErr(res.stderr);
      chan.appendLine(res.stdout);

      // Push image to local registry
      res = await this.ssh.execCommand(`ctr image push ${LOCAL_KANTO_REGISTRY}/${tag}`);
      this.checkStdErr(res.stderr);
      chan.appendLine(res.stdout);
    } catch (error) {
      chan.appendLine(`${error}`);
    } finally {
      await deleteTmpFile(path.resolve(__dirname, '../../', `${TARBALL_OUTPUT_PATH}/${GitConfig.PACKAGE}.tar`));
    }
    return `${LOCAL_KANTO_REGISTRY}/${tag}`;
  }

  /**
   * Check for errors in the standard error output and throw an error if found.
   *
   * @param {string} stderr - The standard error output to check for errors.
   */
  private checkStdErr(stderr: string) {
    if (stderr !== '') {
      throw Error(stderr);
    }
  }
}
