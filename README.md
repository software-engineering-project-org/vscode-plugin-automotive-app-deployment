#  Introduction to LAD: Leda App Deployer

##  LAD: Leda App Deployer – an Eclipse Leda Extension for Visual Studio Code


LAD facilitates the installation of an Eclipse Velocitas App on a target device running Eclipse Leda (with Kanto). With LAD, three different deployment options called "Deployment-Variants" are selectable, to save time during Vehicle App development.

**Important NOTE:** The base requirement is to have one (or many) target device(s) which can be accessed from this source device via SSH. Each Deployment-Variant requires configurations on the source and/or the target system, which is described in the prerequisites of each Deployment-Variant. If you with to use the plugin for deployment on a different operating system and not use Leda, refer to "Prerequisites for Plugin Usage on different Operating Systems (without Leda)"

## Install the Extension in Visual Studio Code
LAD is not published on the official Marketplace of Visual Studio Code by now. You need to manually install the Extension in Visual Studio Code by following these simple steps:

0. Install the Visual Studio Code Command Line Interface "code" if you have not done it earlier. To check if code is already installed, open a Terminal and type in ```code```.
If code is not present, do the following to install it:
	- Open the Command Pallette In Visual Studio Code by pressing *Ctrl+Shift+P* on Windows or Linux or *Shift+⌘+P* on MacOS) 
	- On the Command Pallette, type ```Shell Command: Install 'code' command in PATH``` 
	- Hit enter after granting the necessary permissions for Visual Studio Code. This will add the `code` command to your system's PATH, allowing you to use it in the command prompt or PowerShell.
   
1. Manually download the **.vsix** file from the latest release on this repository OR download the file for the Extension via cURL by opening a Terminal and running:
	```
	curl -o leda-app-deployer.vsix -L https://github.com/eclipse-leda/leda-contrib-vscode-extensions/releases/latest/download/leda-app-deployer.vsix
	```
	 
2.  Install the Extension via code with the following by running:
	```
	code --install-extension leda-app-deployer.vsix
	```
	
After successful installation, LAD is now visible in Visual Studio Code as an Extension button that looks like a target ◎.

##  Three different Ways (called "Deployment-Variants") to deploy your Application

###  Deployment-Variant 01: The Remote Build

**Description:**

Use this Deployment-Variant to install Velocitas App images on a target device from a remote source. Images refer to the available images in the GitHub repositories' registry (ghcr) your application is pulled from. The target system automatically downloads the specified image from the remote GitHub Repository with the help of LAD. You can choose between the different image releases available for your Repository via dropdown.

**Prerequisites:**

-  Internet connection on both the source and target device.
-  If the source GitHub Repository (ghcr) is private: Authenticate ghcr on the target system by referring to "Authenticate private ghcr on the target device".

  

**The process:**

![Deployment-Variant 01](https://github.com/software-engineering-project-org/vscode-plugin-automotive-app-deployment/blob/main/resources/deployment-variant_1.png)


**Detailed steps the Extension performs for you:**

1.  Connects to the target device via SSH.
2.  Checks if local-registries are set in Kanto config:
	-  Checks the `/etc/container-management/config.json` file.
	-  Examines the `registry_configurations` object.
3.  Generates a string and inserts it into the Kanto Manifest.
4.  Copies the Manifest to the target device via SCP.

  

###  Deployment-Variant 02: The Hybrid Build

  

**Description:**

Use this Deployment-Variant to first download the Velocitas App image from the web (or specify a local path to a .tar file) and then transfer it to the target system via a local network. The target system does not require an Internet connection. If a local path is specified, the source device does not require an internet connection as well.

**Prerequisites:**

-  Local registry on the target device: Allow the use beforehand by referring to the section "Add the local registry on the target device".

  

**The process:**

![Deployment-Variant 02](https://github.com/software-engineering-project-org/vscode-plugin-automotive-app-deployment/blob/main/resources/deployment-variant_2.png)

  

**Detailed steps the Extension performs for you:**

1.  Connects to the target device via SSH.
2.  Checks if local-registries are set in Kanto Config:
	-  Checks the `/etc/container-management/config.json` file.
	-  Examines the `registry_configurations` object.
3.  Downloads tar source or reference from the local device.
4.  Copies the Tarball to the Leda Device via SCP.
5.  Executes the containerd imports.
6.  Generates a string and inserts it into the Manifest.
7.  Copies the Manifest to the Leda Device via SCP.

  

###  Deployment-Variant 03: The Local Build

  

**Description:**

Use this Deployment-Variant to build the Velocitas App image locally via Docker build. The deployment is completely done on a local network, so no internet connection is required, neither on the source device nor on the target device.

  

**Prerequisites:**

-  Docker: Docker must be installed on the source device where the image is built.
-  Dockerfile: A valid Dockerfile must be present in the project's structure.
-  Local registry on the target device: Allow the use beforehand by referring to the section "Add the local registry on the target device".

  

**The process:**

![Deployment-Variant 03](https://github.com/software-engineering-project-org/vscode-plugin-automotive-app-deployment/blob/main/resources/deployment-variant_3.png)

  

**Detailed steps the Extension performs for you:**

1.  Builds Docker Image (checks included).
2.  Exports it as a Tarball (to `.vscode/tmp/*.tar`).
3.  Connects to the device via SSH.
4.  Checks if local-registries are set in Kanto Config:
	-  Checks the `/etc/container-management/config.json` file.
	-  Examines the `registry_configurations` object.
5.  Copies the Tarball to the Leda Device via SCP.
6.  Executes the containerd imports.
7.  Generates a string and inserts it into the Manifest.
8.  Copies the Manifest to the Leda Device via SCP.


##  Device Handling

###  Add, remove & edit target devices; run apps on the device

-  **Add and delete target devices:**

	-  If no target devices have been created yet, this can be done via the "+" button.
	-  To do this, the required information is entered in the prompt that opens.
	-  Once a target device has been created, it can be deleted using the trash can button.

  

-  **Change a previously created target device and do further settings:**

	-  Changes are possible via the pencil icon.
	-  The workspace config file then opens with the existing devices. Data can be further adjusted here.
	-  After saving and clicking the reload button, the changes are displayed and effective.


-  **Deploy apps on devices using LAD:**

	-  To deploy a Velocitas App with LAD, you can choose between the three variants described above:
	-  The cloud icon without an arrow executes Deployment-Variant 01 option 
		"Deploy remote built image remote".
	-  The cloud with the arrow executes Deployment-Variant 02 option 
		"Deploy local built image remote".
	-  The document icon with the arrow executes Deployment-Variant 03 option 
		"Deploy local built image local".

###  Add the local registry on the target device

**Edit Kanto's `config.json` in the Kanto container-management of the target system/device:**

1.  Navigate into the directory: `cd /etc/container-management`.
2.  Alter Kanto config: `vi config.json`.
3.  Add the following section if it is not already there: `"containers":{}`.
4.  After that or in case there is already the "containers" section, just add into that section: 
	"insecure-registries": ["localhost:5000"]
5.  Restart the cm-service with: `sudo systemctl restart container-management.service`.

###  Authenticate private ghcr on the target device

**Edit Kanto's `config.json` in the Kanto container-management of the target system/device:**

1.  Navigate into the directory: `cd /etc/container-management`.
2.  Edit Kanto config: `vi config.json`.
3.  Add the following section if it is not already there: `"containers":{}`.
4.  After that or in case there is already the "containers" section, just add into that section:
	  "registry_configurations": {
		"ghcr.io": {
			"credentials": {
				"user_id": "GITHUB USERNAME",
				"password": "GITHUB PASSWORD"
				}
			}
		}

## Prerequisites for Plugin Usage on different Operating Systems (without Leda)
If we install kanto-cm on top of a different Operating Systems (eg. Raspbian arm64), we have the following dependencies that need to be manually installed: 

- containerd.io (CRI)
- eclipse mosquitto (MQTT Broker)
- https://github.com/eclipse-leda/leda-utils/releases (further utils from the Kanto environment)

**Note:** The utils from Kanto environment should be installed as a system service -> `resources/kanto-auto-deployer.service`.

## Contributing
To be part of this project, please refer to [CONTRIBUTING](CONTRIBUTING.md).
