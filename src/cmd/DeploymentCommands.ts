import * as vscode from 'vscode';
import { ManifestGeneratorJson } from "../svc/ManifestGeneratorJson";

export async function deployManifestToLeda() {
    const templateFilePath = '.vscode/templates/kanto_container_conf_template.json';
        const outputFilePath = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';

        const keyValuePairs = {
            'id': 'sampleapp',
            'name': 'sampleapp',
            'image.name': 'ghcr.io/software-engineering-project-org/vehicle-app-python-template/sampleapp:1.0.5',
          };
        
        const generator = new ManifestGeneratorJson(templateFilePath, outputFilePath);
        generator.generateKantoContainerManifest(keyValuePairs);
        
        vscode.window.showInformationMessage('Deployed to Leda!');
}