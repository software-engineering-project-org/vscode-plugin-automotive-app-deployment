import {NodeSSH} from 'node-ssh';

export class ServiceSsh {
    private sshHost: string;
    private sshUsername: string; 
    private sshPort: number;
    private ssh: NodeSSH;
    private manifestDirecotory: string = "/data/var/containers/manifests";
/**
 * 
 * @param sshHost Remote sshd server
 * @param sshUsername User to connect
 * @param sshPort 
 */
  constructor(sshHost: string, sshUsername: string, sshPort: number) {
    this.sshHost = sshHost;
    this.sshUsername = sshUsername;
    this.sshPort = sshPort;
    this.ssh = new NodeSSH();
    this.initializeSsh();
  }

  private async initializeSsh() {
    await this.ssh.connect({
        port: this.sshPort,
        host: this.sshHost,
        username: this.sshUsername
    })
  }

  public async copyKantoManifestToLeda(localManifestFile: string) {
    try {
        await this.ssh.putFiles([{ 
            local: localManifestFile, 
            remote: `${this.manifestDirecotory}/app.json` 
        }])
    } catch(e) {
        console.log(e)
    }
  }
}

let sshsvc = new ServiceSsh("localhost", "root", 2222);
sshsvc.copyKantoManifestToLeda('.vscode/tmp/tmp_gen_kanto_container_manifest.json');
