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

const { vscode } = require('vscode'); // Import the mocked vscode module
const {
  checkAndHandleTarSource,
  downloadTarFileFromWeb,
} = require('../../utils/helpers');

describe('Tar Source Handling', () => {
  it('checkAndHandleTarSource should handle local TAR file', async () => {
    const mockChannel = new vscode.window.createOutputChannel(); // Use the mocked createOutputChannel method
    const localPath = 'src/test/jest/mock_tar/sample.tar';

    const result = await checkAndHandleTarSource(localPath, mockChannel);
    expect(result).toBe(localPath);
  });

  it('checkAndHandleTarSource should throw an error for non-TAR file', async () => {
    const mockChannel = new vscode.window.createOutputChannel(); // Use the mocked createOutputChannel method
    const nonTarPath = 'src/test/jest/mock_tar/not_a_tar.txt';

    await expect(checkAndHandleTarSource(nonTarPath, mockChannel)).rejects.toThrowError();
  });

  it('checkAndHandleTarSource should throw an error for HTTP source', async () => {
    const mockChannel = new vscode.window.createOutputChannel(); // Use the mocked createOutputChannel method
    const httpPath = 'http://example.com/file.tar';

    await expect(checkAndHandleTarSource(httpPath, mockChannel)).rejects.toThrowError();
  });
});
