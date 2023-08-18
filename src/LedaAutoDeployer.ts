import * as vscode from 'vscode';
import { LedaDeviceTreeItem, DeviceDataProvider } from './provider/DeviceDataProvider';
import { addDevice, deleteDevice } from './cmd/DeviceCommands';
import { deployStageOne, deployStageTwo, deployStageThree } from './cmd/DeploymentCommands';
import { Credentials } from './svc/Credentials';

export default class LedaAutoDeployer {
  private context: vscode.ExtensionContext;
  private deviceDataProvider: DeviceDataProvider;
  private credentials: Credentials;

  /**
   * Create a new instance of LedaAutoDeployer.
   * @param {vscode.ExtensionContext} context - The extension context provided by VSCode.
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.deviceDataProvider = new DeviceDataProvider();
    this.credentials = new Credentials();

    // Register the device data provider as a tree view in VSCode
    context.subscriptions.push(vscode.window.registerTreeDataProvider('devices', this.deviceDataProvider));

    // Listen for changes in configuration and update the device data provider accordingly
    vscode.workspace.onDidChangeConfiguration(() => {
      this.deviceDataProvider.update();
    });

    // Initialize commands for the extension
    this.initCommands();
  }

  /**
   * Initialize the commands for the extension.
   * Registers various commands and their corresponding actions.
   */
  private initCommands() {
    // Register the 'addDevice' command and associate it with the 'addDevice' function
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.addDevice', async () => {
        await addDevice(this.deviceDataProvider);
      }),
    );

    // Register the 'deleteDevice' command and associate it with the 'deleteDevice' function
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.deleteDevice', async (item: LedaDeviceTreeItem) => {
        await deleteDevice(this.deviceDataProvider, item);
      }),
    );

    // Register the 'refreshDevices' command and associate it with updating the device data provider
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.refreshDevices', async () => {
        this.deviceDataProvider.update();
      }),
    );

    // Register the 'editDevice' command and associate it with opening the workspace settings file
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.editDevice', async () => {
        await vscode.commands.executeCommand('workbench.action.openWorkspaceSettingsFile');
      }),
    );

    // Register the 'openConfig' command and associate it with opening the workspace settings file
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.openConfig', async () => {
        await vscode.commands.executeCommand('workbench.action.openWorkspaceSettingsFile');
      }),
    );

    // Register the 'deployStageOne' command and associate it with the 'deployStageOne' function
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.deployStageOne', async (item: LedaDeviceTreeItem) => {
        const octokit = await this.credentials.getOctokit();
        await deployStageOne(item, octokit);
      }),
    );

    // Register the 'deployStageTwo' command and associate it with the 'deployStageTwo' function
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.deployStageTwo', async (item: LedaDeviceTreeItem) => {
        await deployStageTwo(item);
      }),
    );

    // Register the 'deployStageThree' command and associate it with the 'deployStageThree' function
    this.context.subscriptions.push(
      vscode.commands.registerCommand('automotive-app-deployment.deployStageThree', async (item: LedaDeviceTreeItem) => {
        await deployStageThree(item);
      }),
    );
  }
}
