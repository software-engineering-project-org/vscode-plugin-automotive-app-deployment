import * as vscode from "vscode";
import { LedaDeviceTreeItem } from "./provider/DeviceDataProvider";
import { DeviceDataProvider } from "./provider/DeviceDataProvider";
import { addDevice, deleteDevice } from "./cmd/DeviceCommands"
import { deployManifestToLeda } from "./cmd/DeploymentCommands";

export default class LedaAutoDeployer {
    private context: vscode.ExtensionContext;
    private deviceDataProvider: DeviceDataProvider;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.deviceDataProvider = new DeviceDataProvider();

        context.subscriptions.push(
            vscode.window.registerTreeDataProvider(
                'devices', 
                this.deviceDataProvider
            )
        )

        vscode.workspace.onDidChangeConfiguration(() => {
            this.deviceDataProvider.update();
        })

        this.initCommands();
    }


    private initCommands() {

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.addDevice', async () => {
                await addDevice(this.deviceDataProvider);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.deleteDevice', async (device: LedaDeviceTreeItem) => {
                await deleteDevice(this.deviceDataProvider, device);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.refreshDevices', async () => {
                await this.deviceDataProvider.update();
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.editDevice', async (item) => {
                await vscode.commands.executeCommand("workbench.action.openWorkspaceSettingsFile");
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.openConfig', async () => {
                await vscode.commands.executeCommand(
                    "workbench.action.openWorkspaceSettingsFile"
                  );
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.deployManifestToLeda', async () => {
                await deployManifestToLeda();
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.deployApplication', async (item) => {
                vscode.window.showInformationMessage('Deploy Application');
                console.log(item);
                // TODO
            })
        );
    }
}