import * as vscode from 'vscode';
import {
  LedaDeviceTreeItem,
  DeviceDataProvider,
} from './provider/DeviceDataProvider';
import { addDevice, deleteDevice } from './cmd/DeviceCommands';
import {
  deployStageOne,
  deployStageTwo,
  deployStageThree,
} from './cmd/DeploymentCommands';
import { Credentials } from './svc/Credentials';

export default class LedaAutoDeployer {
  private context: vscode.ExtensionContext;
  private deviceDataProvider: DeviceDataProvider;
  private credentials: Credentials;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.deviceDataProvider = new DeviceDataProvider();
    this.credentials = new Credentials();

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'devices',
        this.deviceDataProvider,
      ),
    );

    vscode.workspace.onDidChangeConfiguration(() => {
      this.deviceDataProvider.update();
    });

    this.initCommands();
  }

  private initCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.addDevice',
        async () => {
          await addDevice(this.deviceDataProvider);
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.deleteDevice',
        async (item: LedaDeviceTreeItem) => {
          await deleteDevice(this.deviceDataProvider, item);
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.refreshDevices',
        async () => {
          this.deviceDataProvider.update();
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.editDevice',
        async () => {
          await vscode.commands.executeCommand(
            'workbench.action.openWorkspaceSettingsFile',
          );
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.openConfig',
        async () => {
          await vscode.commands.executeCommand(
            'workbench.action.openWorkspaceSettingsFile',
          );
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.deployStageOne',
        async (item: LedaDeviceTreeItem) => {
          const octokit = await this.credentials.getOctokit();
          await deployStageOne(item, octokit);
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.deployStageTwo',
        async (item: LedaDeviceTreeItem) => {
          const octokit = await this.credentials.getOctokit();
          await deployStageTwo(item, octokit);
        },
      ),
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        'automotive-app-deployment.deployStageThree',
        async (item: LedaDeviceTreeItem) => {
          await deployStageThree(item);
        },
      ),
    );
  }
}
