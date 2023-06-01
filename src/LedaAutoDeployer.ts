import * as vscode from "vscode";
import { ManifestGeneratorJson } from "./svc/ManifestGeneratorJson";
import { ServiceSsh } from "./svc/ServiceSsh";

export default class LedaAutoDeployer {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initCommands();
    }

    private initCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.helloWorld', () => {
                vscode.window.showInformationMessage('Hello World from Automotive App Deployment!');
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.openConfig', async () => {
                await vscode.commands.executeCommand(
                    "workbench.action.openWorkspaceSettingsFile"
                  )
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.deployManifestToLeda', async () => {
                await this.deployManifestToLeda()
            })
        )
    }

    private async deployManifestToLeda() {
        console.log("Hello World")
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
}