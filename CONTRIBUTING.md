# How to Contribute to Leda App Deployer (LAD) – an Eclipse Leda Extension for Visual Studio Code

First of all, thanks for considering to contribute to Eclipse Velocitas. We really
appreciate the time and effort you want to spend helping to improve things around here.

In order to get you started as fast as possible we need to go through some organizational issues first, though.

## Eclipse Contributor Agreement

Before your contribution can be accepted by the project team contributors must
electronically sign the Eclipse Contributor Agreement (ECA).

- http://www.eclipse.org/legal/ECA.php

Commits that are provided by non-committers must have a Signed-off-by field in
the footer indicating that the author is aware of the terms by which the
contribution has been provided to the project. The non-committer must
additionally have an Eclipse Foundation account and must have a signed Eclipse
Contributor Agreement (ECA) on file.

For more information, please see the Eclipse Committer Handbook:
https://www.eclipse.org/projects/handbook/#resources-commit

## Code Style Guide

- Use [ESLint](https://eslint.org//) to check for code quality issues.
- Use `strict` mode in your code.

## Making Your Changes

- Fork the repository on GitHub.
- Create a new branch for your changes.
- Make your changes following the code style guide (see Code Style Guide section above).
- When you create new files make sure you include a proper license header at the top of the file (see License Header section below).
- Make sure you include test cases and new examples for non-trivial features.
- Make sure test cases provide sufficient code coverage (see GitHub actions for minimal accepted coverage).
- Make sure the unit test suites passes after your changes.
- Commit your changes into that branch.
- Use descriptive and meaningful commit messages. Start the first line of the commit message with the issue number and title e.g. `[#9865] Add token based authentication`.
- Squash multiple commits that are related to each other semantically into a single one.
- Make sure you use the `-s` flag when committing as explained above.
- Push your changes to your branch in your forked repository.

## License Header

Please make sure any file you newly create contains a proper license header like this:

```javascript
// Copyright (c) 2023 Robert Bosch GmbH and Microsoft Corporation
//
// This program and the accompanying materials are made available under the
// terms of the Apache License, Version 2.0 which is available at
// https://www.apache.org/licenses/LICENSE-2.0.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.
//
// SPDX-License-Identifier: Apache-2.0
```

Please adjusted the comment character to the specific file format.

## Submitting the Changes

Submit a pull request via the normal GitHub UI.

## After Submitting

- Do not use your branch for any other development, otherwise further changes that you make will be visible in the PR.

## Project-specific Developer Information

### Pre-Commit Hooks with Husky

In this project, we have set up pre-commit hooks using Husky to ensure code quality and consistency before each commit. These hooks run a series of checks and tests to ensure that only clean and properly formatted code is committed to the repository.

**NOTE:** For further Pre-Commit Hooks, please alter the [husky configuration](.husky/pre-commit).

#### How it Works

1. **Husky Configuration**: We've configured Husky, a Git hook manager, to execute specific scripts before each commit.

2. **Linter Check**: First, the linter is run to check your code for any syntax or style issues. This ensures that your code follows a consistent coding style.

3. **Code Formatting:** Next, Prettier is used to automatically format your code according to the predefined coding style rules.

4. **Jest Tests:** Finally, the Jest tests are executed to validate the functionality of your code. If any tests fail, the commit process will be aborted.

## How to develop this VSCode-Extension

0. Clone this repository.
1. Run ```npm install```.
2. Run ```npm run watch``` to start Dev-Mode. This opens a separate Window with a VSCode-Environment running the Extension for development.
3. Refer to the Welcome Page or [README](README.md) to add target devices for testing.

*Hint:* Refer to the [official VSCode Plugin Development Documentation](https://code.visualstudio.com/api/get-started/your-first-extension) to get further information on how to develop using the VSCode extension API.

