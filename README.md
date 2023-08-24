# Setup environment 
You need:
- Running leda instance connected to a local network or the internet 
- Working private container registry that is running on leda 
- Preconfigured configuration of the container-management service
- Further resources in `resources` folder

## Connect your Leda instance

```shell
# Set local port forward to remote host (local machine)
ssh -f -N -L 2222:localhost:2222 eclipse@20.229.224.77

# Connect with local ssh cli (local machine)
ssh root@localhost -p 2222
```

## Install a private container registry 
To safe locally stored images we need a local container registry. 
We installed the container registry via kanto-cm the manifest file can be found under `resources/registry.json` in this repository. 

## Container management configuration file
The container management config file is stored under `/etc/container-management/config.json` on your Leda device. Add following lines: 

```json
"containers":{
    "insecure-registries":[
            "localhost:5000"
    ], 
    "registry_configurations": {
        "ghcr.io": {
            "credentials": {
                "user_id": "github",
                "password": "ghp_mygithubtoken"
            }
        }
    }
}   
```

## Further resources 
If we install kanto-cm on top of another OS (eg. Raspbian arm64) we have following dependencies: 
- containerd.io
- eclipse mosquitto 
- https://github.com/eclipse-leda/leda-utils/releases

These dependencies include the container runtime, the MQTT Broker and further utils from the kanto environment like kanto UI or the kanto auto deployer. This one should be installed as a system service -> `resources/kanto-auto-deployer.service`.

# vscode-plugin-automotive-app-deployment
Code base for the VSCode plugin development to automate automotive app deployment

# automotive-app-deployment 

This is the README for your extension "automotive-app-deployment". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

