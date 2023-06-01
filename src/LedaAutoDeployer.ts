import * as vscode from "vscode";
import { Uri } from "vscode";

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
        vscode.window.showInformationMessage('Deployed to Leda!');
    }
}