import {NodeSSH} from 'node-ssh';

export class ServiceSsh {
    private sshHost: string;
    private sshUsername: string; 
    private sshPort: number;
    private ssh: NodeSSH;
    private manifestDirecotory: string = "/data/var/containers/manifests";
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
  private async initializeSsh() {
    try {
      await this.ssh.connect({
        port: this.sshPort,
        host: this.sshHost,
        username: this.sshUsername
    })
    } catch(e) {
        console.log(e)
    }
  }

  /**
   * The generated manifest file will be copied via ssh to remote host (leda)
   * @param localManifestFile - location of manifest file to copy to remote
   */
  public async copyKantoManifestToLeda(localManifestFile: string) {
    await this.initializeSsh()
    try {
        await this.ssh.putFiles([{ 
            local: localManifestFile, 
            remote: `${this.manifestDirecotory}/app.json` 
        }])
        console.log(`Manifest copied to - ${this.manifestDirecotory} - on Remote!`)
    } catch(e) {
        console.log(e)
    } finally {
      this.ssh.dispose()
    }
  }
}
