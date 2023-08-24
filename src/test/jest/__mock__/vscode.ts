// __mocks__/vscode.js
class OutputChannel {
  constructor() {
    this.lines = [];
  }

  appendLine(line) {
    this.lines.push(line);
  }

  clear() {
    this.lines = [];
  }
}

const vscode = {
  window: {
    createOutputChannel: jest.fn(() => new OutputChannel()),
  },
};

const chan = {
  lines: [],
  appendLine(line) {
    this.lines.push(line);
  },
  clear() {
    this.lines = [];
  },
};

module.exports = { vscode, chan };
