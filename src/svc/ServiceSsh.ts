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

import { NodeSSH } from 'node-ssh';
import * as path from 'path';
import { JSONPath } from 'jsonpath-plus';
import { readFileAsync, deleteTmpFile } from '../helpers/helpers';
import * as vscode from 'vscode';
import { TopConfig } from '../provider/TopConfig';
import { KANTO_CONFIG_FILE, CONTAINER_REGISTRY, LOCAL_KANTO_REGISTRY, TARBALL_OUTPUT_PATH, NECESSARY_DEVICE_CLI_TOOLINGS } from '../setup/cmdProperties';
import {
  LADCheckKantoConfig,
  LADUnmetDependenciesError,
  SSHCloseConnectionError,
  SSHConnectionInitilizationError,
  SSHCopyFileError,
  SSHRemoteCommandFailedError,
  logToChannelAndErrorConsole,
} from '../error/customErrors';

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
    } catch (err) {
      throw logToChannelAndErrorConsole(chan, new SSHConnectionInitilizationError(err as Error), `Device ${this.sshHost} on port ${this.sshPort} -> Check config`);
    }
  }

  /**
   * Check all necessary dependencies before stage execution
   */
  public async checkDeviceDependencies(chan: vscode.OutputChannel) {
    chan.appendLine('Checking dependencies...');
    for (let tool of NECESSARY_DEVICE_CLI_TOOLINGS) {
      try {
        let prefix = tool.type == 'service' ? `systemctl status` : '';
        let suffix = tool.type == 'cli' ? 'is installed' : 'is active';
        let res = await this.ssh.execCommand(`${prefix} ${tool.name}`);
        this.checkStdErr(res.stderr, tool.name);
        chan.appendLine(`${tool.name} ${suffix} \u2705`);
      } catch (err) {
        let suffix = tool.type == 'cli' ? 'not installed' : 'not active';
        chan.appendLine(`${tool.name} ${suffix} \u26A0`);
        throw logToChannelAndErrorConsole(chan, new LADUnmetDependenciesError(err as Error));
      }
    }
  }

  /**
   * Close the SSH connection.
   */
  public async closeConn(chan: vscode.OutputChannel) {
    try {
      this.ssh.dispose();
    } catch (err) {
      throw logToChannelAndErrorConsole(chan, new SSHCloseConnectionError(err as Error), `Device ${this.sshHost} on port ${this.sshPort} -> Check config`);
    }
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
    } catch (err) {
      throw logToChannelAndErrorConsole(chan, new SSHCopyFileError(err as Error), `Error copying resource to Leda from (local) ${local} (to) ${remote}`);
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
      await this.ssh.getFile(tmpConfig, KANTO_CONFIG_FILE);
      chan.appendLine(`Fetch Config:\t\t Found file at - ${KANTO_CONFIG_FILE} - Checking config...`);
    } catch (err) {
      throw logToChannelAndErrorConsole(chan, new SSHCopyFileError(err as Error), `Error copying Kanto config from Leda to ${KANTO_CONFIG_FILE}`);
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
        throw new Error(`Stage requires key: ${key} to be set in ${configPath}`);
      } else {
        chan.appendLine(`Check Config:\t\t Successful -> ${key} exists.`);
      }
    } catch (err) {
      throw logToChannelAndErrorConsole(chan, new LADCheckKantoConfig(err as Error), `Check config version and remote file`);
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
  public async containerdOperations(tag: string, chan: vscode.OutputChannel): Promise<string> {
    try {
      const ctrImageImport = 'ctr image import';
      const ctrImageTag = 'ctr image tag';
      const ctrImagePush = 'ctr image push';

      // Import image
      let res = await this.ssh.execCommand(`${ctrImageImport} ${TopConfig.PACKAGE}.tar`, { cwd: '/tmp' });
      this.checkStdErr(res.stderr, ctrImageImport);
      chan.appendLine(res.stdout);
      let registry = CONTAINER_REGISTRY.ghcr;

      // Tag image with local registry prefix
      if (tag === '') {
        let fullTag = res.stdout.split(' ')[1];
        tag = fullTag.substring(fullTag.indexOf('/') + 1);
        registry = CONTAINER_REGISTRY.docker;
      }

      chan.appendLine(`Tagging -> ${registry}/${tag} TO ${LOCAL_KANTO_REGISTRY}/${tag}_${TopConfig.KCM_TIMESTAMP}`);

      res = await this.ssh.execCommand(`${ctrImageTag} ${registry}/${tag} ${LOCAL_KANTO_REGISTRY}/${tag}_${TopConfig.KCM_TIMESTAMP}`);
      this.checkStdErr(res.stderr, ctrImageTag);
      chan.appendLine(res.stdout);

      tag += `_${TopConfig.KCM_TIMESTAMP}`;

      // Push image to local registry
      res = await this.ssh.execCommand(`${ctrImagePush} ${LOCAL_KANTO_REGISTRY}/${tag}`);
      this.checkStdErr(res.stderr, ctrImagePush);
      chan.appendLine(res.stdout);
    } catch (err) {
      throw logToChannelAndErrorConsole(chan, new SSHRemoteCommandFailedError(err as Error), `Failed with command`);
    } finally {
      await deleteTmpFile(path.resolve(__dirname, '../../', `${TARBALL_OUTPUT_PATH}/${TopConfig.PACKAGE}.tar`));
    }
    return `${LOCAL_KANTO_REGISTRY}/${tag}`;
  }

  /**
   * Check for errors in the standard error output and throw an error if found.
   *
   * @param {string} stderr - The standard error output to check for errors.
   */
  private checkStdErr(stderr: string, cmd: string) {
    if (stderr !== '') {
      throw Error(`${cmd}\n${stderr}`);
    }
  }
}
