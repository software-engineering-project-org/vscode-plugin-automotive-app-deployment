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

// Versions of a GitHub Registry Package in the Build Image assigned to a Repo of an Org.
// (n PackageVersions : 1 Repository)
export interface PackageVersion {
  image_name_sha: string; // Unique identifier of a Version
  tags: string[]; // Tags associated with the version, empty if no tags given
  created_at: string;
  updated_at: string;
}

// Helper interface for RegistryOperationsOrg Class methods.
export interface PackageImage {
  name: string; // Name of the package image
  repository: {
    full_name: string; // Full name of the repository associated with the package image
  };
}
