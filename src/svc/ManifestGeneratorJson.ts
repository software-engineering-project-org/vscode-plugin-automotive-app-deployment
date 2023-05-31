import * as fs from 'fs';
import * as path from 'path';

export class ManifestGeneratorJson {
  private templateFilePath: string;
  private outputFilePath: string;

  /**
   * Create a new instance of ManifestGenerator.
   * @param {string} templateFilePath - The path to the template JSON file.
   * @param {string} outputFilePath - The path to the output file where the generated JSON will be saved.
   */
  constructor(templateFilePath: string, outputFilePath: string) {
    this.templateFilePath = templateFilePath;
    this.outputFilePath = outputFilePath;
  }

  /**
   * Generate the Kanto Container manifest by altering values from the template JSON.
   * @param {Record<string, any>} keyValuePairs - The key-value pairs to modify in the template JSON.
   */
  public generateKantoContainerManifest(keyValuePairs: Record<string, any>): void {
    const templateJson = this.loadTemplateJson();
    const modifiedJson = this.alterJson(templateJson, keyValuePairs);
    this.saveModifiedJson(modifiedJson);
  }

  /**
   * Load the template JSON file.
   * @returns {any} The parsed JSON data from the template file.
   */
  private loadTemplateJson(): any {
    const fileContents = fs.readFileSync(this.templateFilePath, 'utf8');
    return JSON.parse(fileContents);
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
  private saveModifiedJson(modifiedJson: any): void {
    const outputDir = path.dirname(this.outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const updatedJson = JSON.stringify(modifiedJson, null, 2);
    fs.writeFileSync(this.outputFilePath, updatedJson, 'utf8');

    console.log(`Modified JSON saved to: ${this.outputFilePath}`);
  }
}