import { createInterface, type Interface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { EditorApplication } from './EditorApplication';

export class Repl {
  private readonly input: Readable;
  private readonly output: Writable;

  constructor(
    private readonly app: EditorApplication,
    input: Readable = process.stdin,
    output: Writable = process.stdout,
  ) {
    this.input = input;
    this.output = output;
  }

  start(): Interface {
    this.output.write("svg-editor 0.1 — type 'help' for commands\n\n");
    const readline = createInterface({ input: this.input, terminal: false });
    const prompt = (): void => {
      this.output.write('svg> ');
    };

    prompt();
    readline.on('line', (line) => {
      for (const outputLine of this.app.processLine(line)) {
        this.output.write(`${outputLine}\n`);
      }
      prompt();
    });
    return readline;
  }
}
