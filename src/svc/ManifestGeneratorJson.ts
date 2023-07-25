import * as fs from 'fs';
import * as path from 'path';
import { readFileAsync } from '../helpers/helpers';
import * as vscode from 'vscode';

export class ManifestGeneratorJson {
  private templateFilePath: string;
  private outputFilePath: string;

  /**
   * Create a new instance of ManifestGenerator.
   * @param {string} templateFilePath - The path to the template JSON file.
   * @param {string} outputFilePath - The path to the output file where the generated JSON will be saved.
   */
  constructor(templateFilePath: string, outputFilePath: string) {
    this.templateFilePath = path.resolve(__dirname, '../../', templateFilePath);
    this.outputFilePath = path.resolve(__dirname, '../../', outputFilePath);
  }

  public static async readVelocitasJson(velocitasSettings: string): Promise<any> {
    const fileContents = await readFileAsync(path.resolve(__dirname, '../../', velocitasSettings));
    const velocitasJson = JSON.parse(fileContents);
    return {
      AppManifestPath: velocitasJson.variables.appManifestPath,
      GithubRepoId: velocitasJson.variables.githubRepoId,
      DockerfilePath: velocitasJson.variables.dockerfilePath,
    };
  }

  public static async readAppManifest(manifestPath: string): Promise<any> {
    const fileContents = await readFileAsync(path.resolve(__dirname, '../../', manifestPath));
    const manifestJson = JSON.parse(fileContents);
    const packageName = (manifestJson[0].name as string).toLowerCase();
    return {
      Name: packageName,
    };
  }

  /**
   * Generate the Kanto Container manifest by altering values from the template JSON.
   * @param {Record<string, any>} keyValuePairs - The key-value pairs to modify in the template JSON.
   */
  public generateKantoContainerManifest(keyValuePairs: Record<string, any>, chan: vscode.OutputChannel): void {
    this.loadTemplateJson(chan, (templateJson: any) => {
      const modifiedJson = this.alterJson(templateJson, keyValuePairs);
      this.saveModifiedJson(modifiedJson, chan);
    });
  }

  /**
   * Load the template JSON file.
   * @param {Function} callback - The callback function to handle the parsed JSON data from the template file.
   */
  private loadTemplateJson(chan: vscode.OutputChannel, callback: (templateJson: any) => void): void {
    fs.readFile(this.templateFilePath, 'utf8', (err, fileContents) => {
      try {
        if (err) {
          chan.appendLine(err.message);
          throw new Error('Error reading template JSON file');
        }
        const templateJson = JSON.parse(fileContents);
        callback(templateJson);
      } catch (error) {
        chan.appendLine(`${error}`);
        throw new Error(`Error parsing template JSON: ${error}`);
      }
    });
  }

  /**
   * Alter the JSON object by replacing values based on key-value pairs.
   * @param {any} jsonObj - The JSON object to modify.
   * @param {Record<string, any>} keyValuePairs - The key-value pairs to modify in the JSON object.
   * @returns {any} The modified JSON object.
   */
  private alterJson(jsonObj: any, keyValuePairs: Record<string, any>): any {
    const modifiedJson = { ...jsonObj };
    for (const key in keyValuePairs) {
      if (Object.prototype.hasOwnProperty.call(keyValuePairs, key)) {
        const value = keyValuePairs[key];
        const keys = key.split('.');
        let currentObj = modifiedJson;

        for (let i = 0; i < keys.length - 1; i++) {
          const currentKey = keys[i];
          if (!currentObj.hasOwnProperty(currentKey)) {
            throw new Error(`Key '${currentKey}' not found in JSON object.`);
          }
          currentObj = currentObj[currentKey];
        }

        const lastKey = keys[keys.length - 1];
        if (!currentObj.hasOwnProperty(lastKey)) {
          throw new Error(`Key '${lastKey}' not found in JSON object.`);
        }
        currentObj[lastKey] = value;
      }
    }
    return modifiedJson;
  }

  /**
   * Save the modified JSON object to the specified output file.
   * @param {any} modifiedJson - The modified JSON object to save.
   */
  private saveModifiedJson(modifiedJson: any, chan: vscode.OutputChannel): void {
    const outputDir = path.dirname(this.outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const updatedJson = JSON.stringify(modifiedJson, null, 2);
    fs.writeFile(this.outputFilePath, updatedJson, 'utf8', (err) => {
      if (err) {
        chan.appendLine(err.message);
        throw new Error('Error writing modified JSON file');
      }
      chan.appendLine(`Adjust Kanto Manifest:\t Modified JSON saved!`);
    });
  }
}
