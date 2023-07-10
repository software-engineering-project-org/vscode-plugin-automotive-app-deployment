import { ManifestGeneratorJson } from "../svc/ManifestGeneratorJson";

export class GitConfig {
    public static ORG: string; 
    public static REPO: string;
    public static PACKAGE: string; 
    public static DOCKERFILE: string;
    public static PACKAGE_TYPE: 'container'; 
    public static CONTAINER_REGISTRY: 'ghcr.io' | 'docker.io';
    public static LOCAL_KANTO_REGISTRY = 'localhost:5000';
    public static TARBALL_OUTPUT_PATH = '.vscode/tmp';

    public static async init() {
        const velocitasSettings = await ManifestGeneratorJson.readVelocitasJson(".velocitas.json");
        const manifestData = await ManifestGeneratorJson.readAppManifest(velocitasSettings.AppManifestPath);
        const remoteOrigin = velocitasSettings.GithubRepoId;
        this.DOCKERFILE = velocitasSettings.DockerfilePath;
        this.ORG = remoteOrigin.split("/")[0];
        this.REPO = remoteOrigin.split("/")[1];
        this.PACKAGE = manifestData.Name;
        this.PACKAGE_TYPE = 'container';
        this.CONTAINER_REGISTRY = 'ghcr.io';
    }
} 
