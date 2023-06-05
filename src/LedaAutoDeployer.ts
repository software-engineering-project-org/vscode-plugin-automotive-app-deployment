import * as vscode from "vscode";
import { ManifestGeneratorJson } from "./svc/ManifestGeneratorJson";
import { DeviceDataProvider } from "./svc/DeviceDataProvider";
import { ServiceSsh } from "./svc/ServiceSsh";

//Interface specifies, the config and its datatypes for a device
interface Device {
    title: string,
    ipAddress: string
}

export default class LedaAutoDeployer {
    private context: vscode.ExtensionContext;
    private deviceDataProvider: DeviceDataProvider = new DeviceDataProvider();  

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initCommands();
        vscode.window.registerTreeDataProvider('leda-app-auto-deployer-devices', this.deviceDataProvider);
    }


    private initCommands() {

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.addDevice', async () => {
                var title: string, ipAddress: string;

                let optionsTitle: vscode.InputBoxOptions = {
                    prompt: "Title: ",
                    placeHolder: "Waveshare Jetracer"
                };

                let optionsIPAddress: vscode.InputBoxOptions = {
                    prompt: "IP: ",
                    placeHolder: "192.168.0.7",
                    validateInput: text => {
                        return this.validateIPaddress(text) ? null : 'No valid IP Address';
                    }
                };

                //Frist Input PopUp -> Title
                await vscode.window.showInputBox(optionsTitle).then( async (value) => {
                    if (!value) {return;};
                    title = value;

                    //Second Input PopUp -> IP Address
                    await vscode.window.showInputBox(optionsIPAddress).then(value => {
                        if (!value) {return;};
                        ipAddress = value;

                        //Load Config Data
                        let config = vscode.workspace.getConfiguration('leda-app-deployer');
                        let currentDevices: Device[] | undefined = config.get("devices");

                        //Add new device to config Array
                        currentDevices!.push({title: title, ipAddress: ipAddress});

                        //Update config
                        config.update("devices", currentDevices);

                        //Success message
                        vscode.window.showInformationMessage('New device has been added successfully.');

                        //Update TreeView/Sidebar
                        this.deviceDataProvider.refresh();      
                    });
                });
                
                

            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.deployApplication', (item) => {
                vscode.window.showInformationMessage('Deploy Application');
                console.log(item);
                // TODO

            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.editDevice', async (item) => {
                await vscode.commands.executeCommand("workbench.action.openWorkspaceSettingsFile");
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('automotive-app-deployment.deleteDevice', (item) => {
                //Load Config Data
                let config = vscode.workspace.getConfiguration('leda-app-deployer');
                let currentDevices: object[] | undefined = config.get("devices");

                //Get the position of the device in the config array
                var index = this.getDevicePositionInConfig({title: item.children[0].description, ipAddress: item.children[1].description});

                //Remove device entry at index position
                currentDevices?.splice(index, 1);

                //Update the config
                config.update("leda-app-deployer.devices", currentDevices);

                //Show success message
                vscode.window.showInformationMessage('Device deleted.');

                //Update TreeView/Sidebar
                this.deviceDataProvider.refresh();
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
                await this.deployManifestToLeda();
            })
        );
    }

    private getDevicePositionInConfig(deviceData: Device): number {
        var devices: Array<Device> | undefined = vscode.workspace.getConfiguration('leda-app-deployer').get("devices");
        return devices!.findIndex((device => device.title === deviceData.title && device.ipAddress === deviceData.ipAddress));
    }

    private validateIPaddress(ipaddress: string) {  
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
          return true;  
        }  
        return false;  
      }  

    private async deployManifestToLeda() {
        console.log("Hello World");
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