import { ManifestGeneratorJson } from './ManifestGeneratorJson';

class TestTheManifestGenerator {
  constructor() {
    const inputDir = 'templates/kanto';
    const inputFile = 'kanto_container_conf_template.json';
    const outputDir = 'tmp';
    const outputFile = 'tmp_gen_kanto_container_manifest.json';

    const templateFilePath = `${inputDir}/${inputFile}`;
    const outputFilePath = `${outputDir}/${outputFile}`;

    const manifestGenerator = new ManifestGeneratorJson(templateFilePath, outputFilePath);

    // Example usage: Generating a modified Kanto Container manifest
    manifestGenerator.generateKantoContainerManifest({
      'container_name': 'changed-container-name',
      'image.name': 'changed-the-name-for-image'
    });
  }
}

new TestTheManifestGenerator();