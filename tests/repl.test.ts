import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { EditorApplication } from '../src/cli/EditorApplication';
import { Repl } from '../src/cli/Repl';

describe('Repl', () => {
  it('prints the banner, skips comments and keeps prompting', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on('data', (chunk: Buffer) => chunks.push(chunk));

    const repl = new Repl(new EditorApplication(), input, output);
    const closed = new Promise<void>((resolve) => {
      repl.start().on('close', () => resolve());
    });

    input.write('# comment line\n');
    input.write('init\n');
    input.write('wat\n');
    input.end();
    await closed;

    const text = Buffer.concat(chunks).toString('utf8');
    expect(text).toContain(
      "svg-editor 0.1 — type 'help' for commands\n\n",
    );
    expect(text).toContain('canvas 800x600 created');
    expect(text).toContain('error: unknown command: wat');
    expect(text).not.toContain('comment line');
    expect(text.split('svg> ').length - 1).toBe(4);
  });
});
