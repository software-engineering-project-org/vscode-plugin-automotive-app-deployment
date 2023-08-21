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

const { ManifestGeneratorJson } = require('../../svc/ManifestGeneratorJson');
const fs = require('fs');
const path = require('path');

describe('ManifestGeneratorJson', () => {
  const templateFilePath = '.vscode/templates/kanto_container_conf_template.json';
  const outputFilePath = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';
  const generator = new ManifestGeneratorJson(templateFilePath, outputFilePath);

  it('should generate Kanto Container manifest with modified key-value pairs', async () => {
    const keyValuePairs = {
      'id': 'app',
      'name': 'app',
      'image.name': 'ghcr.io/software-engineering-project-org/vehicle-app-python-template/sampleapp:1.0.5',
      'config.env': ['environment', 'var', 'set'],
    };

    await new Promise(resolve => {
      generator.generateKantoContainerManifest(keyValuePairs);
      setTimeout(resolve, 100); // Adjust the delay if needed
    });

    const modifiedJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../', outputFilePath), 'utf8'));

    expect(modifiedJson.id).toEqual('app');
    expect(modifiedJson.name).toEqual('app');
    expect(modifiedJson.image.name).toEqual('ghcr.io/software-engineering-project-org/vehicle-app-python-template/sampleapp:1.0.5');
    expect(modifiedJson.config.env).toEqual(['environment', 'var', 'set']);
  });
});