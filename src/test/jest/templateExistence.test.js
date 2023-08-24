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

const fs = require('fs');
const path = require('path');

describe('File Existence', () => {
  it('should check if kanto_container_conf_template.json exists', () => {
    const templateFilePath = '.vscode/templates/kanto_container_conf_template.json';
    const absolutePath = path.resolve(__dirname, '../../../', templateFilePath);
    
    const fileExists = fs.existsSync(absolutePath);
    expect(fileExists).toBe(true);
  });
});