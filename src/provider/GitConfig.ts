import { ManifestGeneratorJson } from '../svc/ManifestGeneratorJson';

// TODO: Outsource the hardcode, e.g. in setup directory under providerProperties.ts
export class GitConfig {
  public static ORG: string;
  public static REPO: string;
  public static PACKAGE: string;
  public static DOCKERFILE: string;

  public static async init() {
    const velocitasSettings = await ManifestGeneratorJson.readVelocitasJson('.velocitas.json');
    const manifestData = await ManifestGeneratorJson.readAppManifest(velocitasSettings.AppManifestPath);
    const remoteOrigin = velocitasSettings.GithubRepoId;
    this.DOCKERFILE = velocitasSettings.DockerfilePath;
    this.ORG = remoteOrigin.split('/')[0];
    this.REPO = remoteOrigin.split('/')[1];
    this.PACKAGE = manifestData.Name;
  }
}
