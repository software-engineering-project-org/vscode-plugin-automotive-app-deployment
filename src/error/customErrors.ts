export class InsecureWebSourceError extends Error {
  constructor(sourcePath: string) {
    super(`Error - Insecure web source (HTTP) in given path: "${sourcePath}". Please specify a HTTPS address or a local path.`);
    this.name = 'InsecureWebSourceError';
  }
}

export class LocalPathNotFoundError extends Error {
  constructor(sourcePath: string) {
    super(`Error - Local path: "${sourcePath}" not found on the device.`);
    this.name = 'LocalPathNotFoundError';
  }
}

export class NotTARFileError extends Error {
  constructor(sourcePath: string) {
    super(`Error - File located at path: ${sourcePath} is not a TAR file. Please add a *.tar file.`);
    this.name = 'NotTARFileError';
  }
}

export class GenericInternalError extends Error {
  constructor(message: string) {
    super(`${message}`);
    this.name = 'GenericInternalError';
  }
}
