import { ConfigStringExtractor } from "../svc/GitHubOps/ConfigStringExtractor";
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
        const manifestData = await ManifestGeneratorJson.readAppManifest("app/AppManifest.json");
        const remoteOrigin = await ConfigStringExtractor.extractGitOrgAndRepoNameFromConfig("sample-config-git");
        this.ORG = remoteOrigin.split("/")[0];
        this.REPO = remoteOrigin.split("/")[1];
        this.PACKAGE = manifestData.Name;
        this.PACKAGE_TYPE = 'container';
        this.DOCKERFILE = manifestData.Dockerfile;
        this.CONTAINER_REGISTRY = 'ghcr.io';
    }
} 
