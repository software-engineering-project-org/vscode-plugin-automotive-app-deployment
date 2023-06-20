


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