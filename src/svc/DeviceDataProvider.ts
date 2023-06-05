import * as vscode from "vscode";

export class DeviceDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined
  > = new vscode.EventEmitter<TreeItem | undefined>();

  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this
    ._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    constructor() {}
  
    getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
      return element;
    }
  
    getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
      if (element === undefined) {
        var config = vscode.workspace.getConfiguration('leda-app-deployer');
        var devices: any[] | undefined = config.get("devices");

        return devices!.map(device => new EditeDeviceInformationItem(device.title, [new TreeItem(device.title, "Title"), new TreeItem(device.ipAddress, "IP Address")]));
      }
      return element.children;
    }
  }

  class EditeDeviceInformationItem extends vscode.TreeItem {
    children: TreeItem[] | undefined;

    constructor(label: string, children?: TreeItem[]) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.children = children;
        this.contextValue = "parent";

    }
  }
  
  class TreeItem extends vscode.TreeItem {
    children: TreeItem[]|undefined;
  
    constructor(prefix: string, label: string, children?: TreeItem[]) {
      super(
          label,
          vscode.TreeItemCollapsibleState.None);
      this.children = children;
      this.tooltip = prefix;
      this.description = prefix;
    }
  }