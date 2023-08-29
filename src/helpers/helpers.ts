import { LedaDevice } from '../interfaces/LedaDevice';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { GitConfig } from '../provider/GitConfig';
import * as https from 'https';

/**
 * Open a new WebView after the Extesion is installed or updated.
 * @param context Give the Extesion Context to look for the global State
 * @param disableFirstTimeCheck Disables the check if opens the first time, to open it via command
 */
export function openWelcomePage(context: vscode.ExtensionContext, disableFirstTimeCheck = false): void {
  const version = context.extension.packageJSON.version ?? '1.0.0';
  const previousVersion = context.globalState.get(context.extension.id);
  // Check if a new version is installed
  if (previousVersion === version && disableFirstTimeCheck === false) {
    return;
  }

  //Create a new WebView instance
  const panel = vscode.window.createWebviewPanel('welcomePage', 'Introduction to Leda App Deployer', vscode.ViewColumn.One, {});

  //Load the WebView Content from HTML file
  const filePath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'welcomePage.html');
  let webViewContent = fs.readFileSync(filePath.fsPath, 'utf8');

  //Replace the image placeholder with local URL's to the images. (Its not possile to display images directly via directory path)
  webViewContent = webViewContent.replace('${stage_1}', panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'stage_1.png')).toString());
  webViewContent = webViewContent.replace('${stage_2}', panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'stage_2.png')).toString());
  webViewContent = webViewContent.replace('${stage_3}', panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'stage_3.png')).toString());

  //Set the content to the WebView
  panel.webview.html = webViewContent;

  //Update the extension versin in the global state, to avoid a reopening of welcome page erverytimes
  context.globalState.update(context.extension.id, version);
}

/**
 * Load the list of Leda devices from the configuration.
 * @returns A Promise that resolves to an array of LedaDevice objects, or undefined if no devices are found.
 */
export async function loadLedaDevices(): Promise<LedaDevice[] | undefined> {
  const config = vscode.workspace.getConfiguration('automotive-app-deployment');
  const devices = config.get<Array<LedaDevice>>('devices');
  return devices;
}

/**
 * Save a new Leda device to the configuration.
 * @param newDevice The LedaDevice object to be saved.
 */
export async function saveLedaDevice(newDevice: LedaDevice) {
  const config = vscode.workspace.getConfiguration('automotive-app-deployment');
  const devices = config.get<Array<LedaDevice>>('devices');
  if (devices) {
    const index = devices?.findIndex((device) => device.name === newDevice.name);
    if (index !== undefined && index !== -1) {
      devices[index] = newDevice;
    } else {
      devices.push(newDevice);
    }
    await config.update('devices', devices);
  }
}

/**
 * Remove a Leda device from the configuration.
 * @param targetDevice The LedaDevice object to be removed.
 */
export async function removeLedaDevice(targetDevice: LedaDevice) {
  const config = vscode.workspace.getConfiguration('automotive-app-deployment');
  const devices = config.get<Array<LedaDevice>>('devices');
  if (devices) {
    const index = devices?.findIndex((device) => device.name === targetDevice.name);
    if (index !== undefined && index !== -1) {
      devices.splice(index, 1);
      await config.update('devices', devices);
    }
  }
}

/**
 * Read the content of a file asynchronously.
 * @param filePath The path to the file to be read.
 * @returns A Promise that resolves to the content of the file as a string.
 */
export function readFileAsync(filePath: string): any {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Delete a temporary file.
 * @param filePath The path to the temporary file to be deleted.
 * @returns A Promise that resolves when the file is successfully deleted.
 */
export async function deleteTmpFile(filePath: string): Promise<void> {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw new Error('Could not delete tmp file');
    }
  });
}

/**
 * Execute a shell command and capture the output.
 * @param command The shell command to be executed.
 * @returns A Promise that resolves to the stdout of the command as a string.
 */
export async function executeShellCmd(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        resolve(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Check the source of a TAR file and handle it accordingly.
 * @param src The source of the TAR file (can be a file path or a URL).
 * @param chan The VSCode OutputChannel for logging.
 * @returns A Promise that resolves to the file path of the downloaded TAR file if applicable.
 * @throws Throws an error if the source is not valid or encounters any issues.
 */
export async function checkAndHandleTarSource(src: string, chan: vscode.OutputChannel): Promise<string> {
  let filePath = src;
  try {
    if (src.startsWith('https://')) {
      filePath = await downloadTarFileFromWeb(src, `.vscode/tmp/${GitConfig.PACKAGE}.tar`, chan);
    } else if (src.startsWith('http://')) {
      throw new Error(`Insecure format - HTTP -`);
    } else {
      if (!fs.existsSync(src)) {
        throw new Error(`File ${src} does not exist on local device!`);
      }
      if (!src.endsWith('.tar')) {
        throw new Error(`File ${src} has wrong type - no TAR!`);
      }
    }
    return filePath;
  } catch (err) {
    chan.appendLine(`${err}`);
    throw new Error(`Error identifying *.tar source`);
  }
}

/**
 * Download a TAR file from a URL and save it to a local path.
 * @param url The URL from which to download the TAR file.
 * @param localPath The local path where the TAR file will be saved.
 * @param chan The VSCode OutputChannel for logging.
 * @returns A Promise that resolves to the file path of the downloaded TAR file.
 * @throws Throws an error if the download fails or encounters any issues.
 */
async function downloadTarFileFromWeb(url: string, localPath: string, chan: vscode.OutputChannel): Promise<string> {
  try {
    const filename = path.resolve(__dirname, '../../', localPath);
    https.get(url, (res) => {
      const fileStream = fs.createWriteStream(filename);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        chan.appendLine(`Download finished for ${path.basename(url)}`);
      });
    });
    chan.appendLine(`Saved file to: ${filename}`);
    return filename;
  } catch (err) {
    chan.appendLine(`${err}`);
    throw new Error(`Failed to read from URL`);
  }
}
