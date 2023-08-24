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

// Represents a Leda Device used for deployment.
export interface LedaDevice {
  name: string; // Name of the Leda device
  ip: string; // IP address of the Leda device
  sshPort: number; // SSH port number of the Leda device
  sshUsername: string; // SSH username to connect to the Leda device
  sshPassword?: string; // Optional SSH password for authentication
  sshPublicKeyPath?: string; // Optional path to the SSH public key for authentication
  sshPrivateKeyPath?: string; // Optional path to the SSH private key for authentication
}
