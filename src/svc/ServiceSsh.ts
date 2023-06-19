import { kStringMaxLength } from 'buffer';
import {NodeSSH} from 'node-ssh';
import * as path from 'path';

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
  public async copyKantoManifestToLeda(localManifestFile: string) {
    try {
        await this.ssh.putFiles([{ 
            local: path.resolve(__dirname, '../../', localManifestFile), 
            remote: `${this.manifestDirecotory}/app.json` 
        }]);
        console.log(`Manifest copied to - ${this.manifestDirecotory} - on Remote!`);
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

      console.log(`Found file at - ${this.kantoConfigFile} - Checking config...`);
    }
    catch(e) {
      console.log(e);
      throw new Error(`Error reading kanto conf -> ${(e as Error).message}`)
    }
  }
}
