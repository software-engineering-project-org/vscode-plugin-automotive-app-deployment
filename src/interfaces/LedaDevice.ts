// Represents a Leda Device used for deployment.
export interface LedaDevice {
  name: string; // Name of the Leda device
  ip: string; // IP address of the Leda device
  sshPort: number; // SSH port number of the Leda device
  sshUsername: string; // SSH username to connect to the Leda device
  sshPassword?: string; // Optional SSH password for authentication
  sshPublicKeyPath?: string; // Optional path to the SSH public key for authentication
  sshPrivateKeyPath?: string; // Optional path to the SSH private key for authentication
}