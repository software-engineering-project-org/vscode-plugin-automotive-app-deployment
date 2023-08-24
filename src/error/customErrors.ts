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

import { ERROR_CONSOLE_HEADER } from '../setup/cmdProperties';
import { OutputChannel } from 'vscode';


// The main error function to call when error messages should be channeled to the plugin user.
// Pass the underlying errors here for vscode channeling.  
export function logToChannelAndErrorConsole(chan: OutputChannel, err: Error, msg?: string): never {
  if (msg === undefined) {
    msg = '';
  }
  if (err === undefined) {
    err = new GenericInternalError(msg);
  }
  chan.appendLine(`${ERROR_CONSOLE_HEADER}\n${err}\n${msg}`);
  throw new Error(err.name);
}

// Represents a generic internal error that indicates unexpected issues within the system.
export class GenericInternalError extends Error {
  constructor(message: string) {
    super(`Internal Error - > SYSTEM: ${message}`);
    this.name = 'GenericInternalError';
  }
}

// Represents an error that occurs when the provided web source (HTTP) is insecure and not using HTTPS.
export class InsecureWebSourceError extends Error {
  constructor(sourcePath: string) {
    super(`Error - Insecure web source (HTTP) in given path: "${sourcePath}". Please specify a HTTPS address or a local path.`);
    this.name = 'InsecureWebSourceError';
  }
}

// Represents an error that occurs when the specified local path is not found on the device.
export class LocalPathNotFoundError extends Error {
  constructor(sourcePath: string) {
    super(`Error - Local path: "${sourcePath}" not found on the device.`);
    this.name = 'LocalPathNotFoundError';
  }
}

// Represents an error that occurs when the file located at the specified path is not a TAR file.
export class NotTARFileError extends Error {
  constructor(sourcePath: string) {
    super(`Error - File located at path: ${sourcePath} is not a TAR file. Please add a *.tar file.`);
    this.name = 'NotTARFileError';
  }
}

// Represents an error that occurs when the remote origin URL is not found in the specified git configuration file.
export class RemoteOriginNotFoundError extends Error {
  constructor(gitConfig: string) {
    super(`Error - Remote origin URL not found in "${gitConfig}".`);
    this.name = 'RemoteOriginNotFoundError';
  }
}

// Represents an error that occurs when the remote origin URL in the specified git configuration file is invalid.
export class InvalidRemoteOriginError extends Error {
  constructor(gitConfig: string) {
    super(`Error - Invalid remote origin URL in "${gitConfig}".`);
    this.name = 'InvalidRemoteOriginError';
  }
}

// Represents an error that occurs when there is a problem retrieving package images from the GitHub Package Registry.
export class PackageImagesFetchError extends Error {
  constructor(message: string) {
    super(`Error retrieving package images > SYSTEM: ${message}`);
    this.name = 'PackageImagesFetchError';
  }
}

// Represents an error that occurs when there is a problem retrieving package versions from the GitHub Package Registry.
export class PackageVersionsFetchError extends Error {
  constructor(message: string) {
    super(`Error retrieving package versions: ${message}.`);
    this.name = 'PackageVersionsFetchError';
  }
}

// Represents an error that occurs when the the package name is not found in the retrieved data.
export class PackageNameNotFoundError extends Error {
  constructor(message: string) {
    super(`Package name not found in the retrieved data: ${message}.`);
    this.name = 'PackageNameNotFoundError';
  }
}

// Represents Error while connecting to device via SSH
export class SSHConnectionInitilizationError extends Error {
  constructor(err: Error) {
    super(`Error while trying to establish ssh connection: ${err.message}`);
    this.name = 'SSHConnectionInitilizationError';
  }
}

//  Represents an error while closing SSH connection to device.
export class SSHCloseConnectionError extends Error {
  constructor(err: Error) {
    super(`Error while trying to close ssh connection: ${err.message}`);
    this.name = 'SSHCloseConnectionError';
  }
}

//  Represents an error while copying file via SSH.
export class SSHCopyFileError extends Error {
  constructor(err: Error) {
    super(`Error while trying to copy artefact: ${err.message}`);
    this.name = 'SSHCopyFileError';
  }
}

// Represents command failure on remote device.
export class SSHRemoteCommandFailedError extends Error {
  constructor(err: Error) {
    super(`Error while trying to execute remote command: ${err.message}`);
    this.name = 'SSHRemoteCommandFailedError';
  }
}

// Represents a kanto config check error.
export class LADCheckKantoConfig extends Error {
  constructor(err: Error) {
    super(`Error while checking kanto config: ${err.message}`);
    this.name = 'LADCheckKantoConfig';
  }
}

//  Represents an error while loading template JSON.
export class LADLoadTemplateJSONError extends Error {
  constructor(err: Error) {
    super(`Error loading template JSON: ${err.message}`);
    this.name = 'LADLoadTemplateJSONError';
  }
}

//  Represents an error while saving modfied template JSON.
export class LADSaveModifiedJSONError extends Error {
  constructor(err: Error) {
    super(`Error saving modified JSON: ${err.message}`);
    this.name = 'LADSaveModifiedJSONError';
  }
}

//  Represents an error while altering template JSON.
export class LADAlterJSONError extends Error {
  constructor(err: Error) {
    super(`Error altering JSON: ${err.message}`);
    this.name = 'LADAlterJSONError';
  }
}

//  Represents an error while retrieving Dockerfile.
export class DockerfileNotFoundError extends Error {
  constructor(err: Error) {
    super(`Error finding Dockerfile: ${err.message}`);
    this.name = 'DockerfileNotFoundError';
  }
}

//  Represents an error while building Docker image.
export class DockerBuildFailedError extends Error {
  constructor(err: Error) {
    super(`Error while build: ${err.message}`);
    this.name = 'DockerBuildFailedError';
  }
}

//  Represents an error while exporting Docker image.
export class DockerExportImageError extends Error {
  constructor(err: Error) {
    super(`Error exporting image: ${err.message}`);
    this.name = 'DockerExportImageError';
  }
}
