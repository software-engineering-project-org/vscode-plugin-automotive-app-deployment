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

// TODO: Refactor me.

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

// Represents an error that occurs when the package name is not found in the retrieved data.
export class PackageNameNotFoundError extends Error {
  constructor(message: string) {
    super(`Package name not found in the retrieved data.`);
    this.name = 'PackageNameNotFoundError';
  }
}
