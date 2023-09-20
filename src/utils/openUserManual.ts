/**
 * Copyright (c) 2023 Contributors to the Eclipse Foundation
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * Open a new WebView after the Extesion is installed or updated.
 * @param context Give the Extesion Context to look for the global State
 * @param disableFirstTimeCheck Disables the check if opens the first time, to open it via command
 */
export function openUserManual(context: vscode.ExtensionContext, disableFirstTimeCheck = false): void {
  const version = context.extension.packageJSON.version ?? '1.0.0';
  const previousVersion = context.globalState.get(context.extension.id);
  // Check if a new version is installed
  if (previousVersion === version && disableFirstTimeCheck === false) {
    return;
  }

  //Create a new WebView instance
  const panel = vscode.window.createWebviewPanel('userManual', 'Introduction to Leda App Deployer', vscode.ViewColumn.One, {});

  //Load the WebView Content from HTML file
  const filePath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'userManual.html');
  let webViewContent = fs.readFileSync(filePath.fsPath, 'utf8');

  //Replace the image placeholder with local URL's to the images. (Its not possile to display images directly via directory path)
  webViewContent = webViewContent.replace('${deployment-variant_1}', panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'deployment-variant_1.png')).toString());
  webViewContent = webViewContent.replace('${deployment-variant_2}', panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'deployment-variant_2.png')).toString());
  webViewContent = webViewContent.replace('${deployment-variant_3}', panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'deployment-variant_3.png')).toString());

  //Set the content to the WebView
  panel.webview.html = webViewContent;

  //Update the extension versin in the global state, to avoid a reopening of User Manual erverytime
  context.globalState.update(context.extension.id, version);
}
