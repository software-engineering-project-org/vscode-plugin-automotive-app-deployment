const fs = require('fs');
const { ManifestGeneratorJson } = require('../../svc/ManifestGeneratorJson');

describe('ManifestGeneratorJsonTemplate', () => {
  const templateFilePath = '.vscode/templates/kanto_container_conf_template.json';
  const outputFilePath = '.vscode/tmp/tmp_gen_kanto_container_manifest.json';

  beforeEach(() => {
    // Clean up the output file before each test
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }
  });

  test('generates the modified Kanto Container manifest', () => {
    const keyValuePairs = {
      'id': 'app',
      'name': 'app',
      'image.name': 'ghcr.io/software-engineering-project-org/vehicle-app-python-template/sampleapp:1.0.5',
      'config.env': ['environment', 'var', 'set']
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
    expect(parsedJson.id).toBe('app');
    expect(parsedJson.name).toBe('app');
    expect(parsedJson.image.name).toBe('ghcr.io/software-engineering-project-org/vehicle-app-python-template/sampleapp:1.0.5');
    expect(parsedJson.config.env).toEqual(['environment', 'var', 'set']);
  });
});