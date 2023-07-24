export interface LedaDevice {
  name: string;
  ip: string;
  sshPort: number;
  sshUsername: string;
  sshPassword?: string;
  sshPublicKeyPath?: string;
  sshPrivateKeyPath?: string;
}
