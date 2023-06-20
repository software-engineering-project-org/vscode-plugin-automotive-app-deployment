import {NodeSSH} from 'node-ssh';
import * as path from 'path';
import { JSONPath } from 'jsonpath-plus';
import { readFileAsync } from '../helpers/helpers';

export class ServiceSsh {
    private sshHost: string;
    private sshUsername: string; 
    private sshPort: number;
    private ssh: NodeSSH;
    private manifestDirecotory: string = "/data/var/containers/manifests";
    private kantoConfigFile: string = "/etc/container-management/config.json"
/**
 * Create a new instance of ServiceSsh.
 * @param sshHost - Remote sshd server
 * @param sshUsername - User to connect
 * @param sshPort - the port your ssh server is listening on
 */
  constructor(sshHost: string, sshUsername: string, sshPort: number) {
    this.sshHost = sshHost;
    this.sshUsername = sshUsername;
    this.sshPort = sshPort;
    this.ssh = new NodeSSH();
  }

  /**
   * Setup the connection to the SSH server defined.
   */
  public async initializeSsh() {
    try {
      await this.ssh.connect({
        port: this.sshPort,
        host: this.sshHost,
        username: this.sshUsername
    });
    } catch(e) {
        console.log(e);
    }
  }

  /**
   * The generated manifest file will be copied via ssh to remote host (leda)
   * @param localManifestFile - location of manifest file to copy to remote
   */
  public async copyKantoManifestToLeda(localManifestFile: string, appName: string) {
    try {
        await this.ssh.putFiles([{ 
            local: path.resolve(__dirname, '../../', localManifestFile), 
            remote: `${this.manifestDirecotory}/${appName}.json` 
        }]);
        console.log(`Copy Kanto Manifest:\t Dest - ${this.manifestDirecotory}/${appName}.json - on Remote!`);
    } catch(e) {
        console.log(e);
        throw new Error(`Error connecting to device: ${this.sshHost} -> ${(e as Error).message}`)
    } finally {
      // Since the copy is the last step of each stage this function closes the ssh connection
      this.ssh.dispose();
    }
  }


  public async getConfigFromLedaDevice(tmpConfig: string) {
    try {
      await this.ssh.getFile(
        path.resolve(__dirname, '../../', tmpConfig), 
        this.kantoConfigFile
      );

      console.log(`Fetch Config:\t\t Found file at - ${this.kantoConfigFile} - Checking config...`);
    }
    catch(e) {
      console.log(e);
      throw new Error(`Error reading kanto conf -> ${(e as Error).message}`)
    }
  }

  public async loadAndCheckConfigJson(configPath: string, key: string) {
    try {
      const fileContents = await readFileAsync(path.resolve(__dirname, '../../', configPath));
      const configJson = JSON.parse(fileContents);
      const keys = JSONPath({ path: key, json: configJson });
  
      if (keys.length === 0) {
        throw new Error(`Stage requires key: ${key} to be set in ${configPath}`);
      } else {
        console.log(`Check Config:\t\t Successful -> ${key} exists.`);
      }
    } catch (error) {
      throw new Error(`Error reading config JSON file: ${error}`);
    }
  }

}
