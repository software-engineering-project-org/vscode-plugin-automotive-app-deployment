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

export const STAGE_ONE_CONSOLE_HEADER = `
******************************************************************************
***           DEPLOYING STAGE ONE - Remote Build and Deployment            ***
******************************************************************************

For further informations/dependencies/configuration refer to the welcome page.
`;

export const STAGE_TWO_CONSOLE_HEADER = `
******************************************************************************
***           DEPLOYING STAGE TWO - Hybrid Build and Deployment            ***
******************************************************************************

For further informations/dependencies/configuration refer to the welcome page.
`;

export const STAGE_THREE_CONSOLE_HEADER = `
******************************************************************************
***           DEPLOYING STAGE THREE - Local Build and Deployment           ***
******************************************************************************

For further informations/dependencies/configuration refer to the welcome page.
`;

export const ERROR_CONSOLE_HEADER = `
******************************************************************************
***         ERROR - Encountered error during extension execution           ***
******************************************************************************
`;

export const TMP_KANTO_CONFIG_PATH = '.vscode/tmp/config.json';
export const KANTO_CONFIG_REMOTE_REG_JSON_PATH = 'containers.registry_configurations["ghcr.io"]';
export const KANTO_CONFIG_LOCAL_REG_JSON_PATH = 'containers.insecure-registries';
export const TEMPLATE_FILE_PATH = '.vscode/templates/kanto_container_conf_template.json';
export const OUTPUT_FILE_PATH = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';
export const MANIFEST_DIR = '/data/var/containers/manifests';
export const KANTO_CONFIG_FILE = '/etc/container-management/config.json';
export const PACKAGE_TYPE = 'container';
export const LOCAL_KANTO_REGISTRY = 'localhost:5000';
export const TARBALL_OUTPUT_PATH = '.vscode/tmp';
export const CONTAINER_REGISTRY = {
  ghcr: 'ghcr.io',
  docker: 'docker.io',
};
export const VELOCITAS_CONFIG_FILE = '.velocitas.json';
