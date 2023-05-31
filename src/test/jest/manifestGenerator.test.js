const fs = require('fs');
const path = require('path');
const { ManifestGeneratorJson } = require('../../svc/ManifestGeneratorJson');

describe('ManifestGeneratorJson', () => {
  const templateFilePath = '/templates/kanto/kanto_container_config_template.json';
  const outputFilePath = '/tmp/tmp_gen_kanto_container_manifest.json';

  beforeEach(() => {
    // Clean up the output file before each test
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }
  });

  test('generates the modified Kanto Container manifest', () => {
    const keyValuePairs = {
      'container_name': 'changed-container-name',
      'image.name': 'changed-the-name-for-image'
    };

    const generator = new ManifestGeneratorJson(templateFilePath, outputFilePath);

    // Generate the modified Kanto Container manifest
    generator.generateKantoContainerManifest(keyValuePairs);

    // Verify that the output file exists
    expect(fs.existsSync(outputFilePath)).toBe(true);

    // Read the generated JSON file
    const generatedJson = fs.readFileSync(outputFilePath, 'utf8');
    const parsedJson = JSON.parse(generatedJson);

    // Verify that the modified values are correctly set in the generated JSON
    expect(parsedJson.container_name).toBe('changed-container-name');
    expect(parsedJson.image.name).toBe('changed-the-name-for-image');
  });
});
