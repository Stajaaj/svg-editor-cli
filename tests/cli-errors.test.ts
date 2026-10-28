import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EditorApplication } from '../src/cli/EditorApplication';
import { makeTempDir } from './support';

describe('document guards and io locking', () => {
  it('requires a document for editing and display commands', () => {
    const app = new EditorApplication();
    const expected = ["error: no document. use 'init' or 'read' first"];
    expect(app.processLine('tree')).toEqual(expected);
    expect(app.processLine('undo')).toEqual(expected);
    expect(app.processLine('redo')).toEqual(expected);
    expect(app.processLine('save x.svg')).toEqual(expected);
    expect(app.processLine('canvas')).toEqual(expected);
    expect(app.processLine('create rect r 0 0 10 10')).toEqual(expected);
    expect(app.processLine('help')[0]).toBe('commands:');
  });

  it('blocks undo and redo after init, save and canvas resize until the next edit', () => {
    const dir = makeTempDir();
    const path = join(dir, 'lock.svg');
    const app = new EditorApplication();

    expect(app.processLine('init')).toEqual(['canvas 800x600 created']);
    expect(app.processLine('undo')).toEqual([
      'error: undo not allowed after io command',
    ]);
    expect(app.processLine('redo')).toEqual([
      'error: undo not allowed after io command',
    ]);
    expect(app.processLine('save')).toEqual([
      "error: no file path; use 'save <file.svg>'",
    ]);

    expect(app.processLine('create rect r 0 0 10 10')).toEqual(['rect#r created']);
    expect(app.processLine(`save ${path}`)).toEqual([
      `saved to ${path} (1 element)`,
    ]);
    expect(app.processLine('undo')).toEqual([
      'error: undo not allowed after io command',
    ]);

    expect(app.processLine('move r 5 5')).toEqual(['rect#r moved to (5,5)']);
    expect(app.processLine('undo')).toEqual(['rect#r moved back to (0,0)']);

    expect(app.processLine('canvas 400 300')).toEqual([
      'canvas resized to 400x300',
    ]);
    expect(app.processLine('undo')).toEqual([
      'error: undo not allowed after io command',
    ]);
  });

  it('clears the redo stack after a new edit', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect a 0 0 10 10');
    app.processLine('move a 1 0');
    expect(app.processLine('undo')).toEqual(['rect#a moved back to (0,0)']);
    expect(app.processLine('create circle b 5 5 2')).toEqual(['circle#b created']);
    expect(app.processLine('redo')).toEqual(['error: nothing to redo']);
  });

  it('reports unknown commands without changing state', () => {
    const app = new EditorApplication();
    expect(app.processLine('wat')).toEqual(['error: unknown command: wat']);
    expect(app.processLine('init')).toEqual(['canvas 800x600 created']);
  });
});

describe('create validation', () => {
  it('reports the specified errors', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect r 0 0 10 10');

    expect(app.processLine('create rect r 1 1 2 2')).toEqual([
      'error: id already exists: r',
    ]);
    expect(app.processLine('create hexagon h 0 0 1 1')).toEqual([
      'error: unknown shape type: hexagon (is the plugin loaded?)',
    ]);
    expect(app.processLine('create rect x 0 0')).toEqual([
      'error: usage: create rect <id> <x> <y> <w> <h> [fill]',
    ]);
    expect(app.processLine('create rect x 0 0 10 nope')).toEqual([
      'error: invalid number: nope',
    ]);
    expect(app.processLine('create rect x 0 0 10 10 in missing')).toEqual([
      'error: no such container: missing',
    ]);
    expect(app.processLine('create rect x 0 0 10 10 in r')).toEqual([
      'error: not a container: r',
    ]);
    expect(app.processLine('create g g1')).toEqual(['g#g1 created']);
    expect(app.processLine('create g g1')).toEqual([
      'error: id already exists: g1',
    ]);
  });
});

describe('edit validation', () => {
  it('reports the specified errors', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect r 0 0 10 10');
    app.processLine('create g g1');
    app.processLine('create rect child 1 1 2 2 in g1');

    expect(app.processLine('delete nope')).toEqual(['error: no such shape: nope']);
    expect(app.processLine('move nope 1 1')).toEqual([
      'error: no such shape: nope',
    ]);
    expect(app.processLine('scale r 0')).toEqual([
      'error: scale factor must be positive',
    ]);
    expect(app.processLine('scale r -1')).toEqual([
      'error: scale factor must be positive',
    ]);
    expect(app.processLine('set r foo bar')).toEqual([
      'error: unknown attribute: foo',
    ]);
    expect(app.processLine('set r x nope')).toEqual(['error: invalid number: nope']);
    expect(app.processLine('group bad child g1')).toEqual([
      'error: cannot group a container into its own descendant: g1',
    ]);
    expect(app.processLine('group bad r r')).toEqual([
      'error: duplicate shape: r',
    ]);
    expect(app.processLine('group g1 r')).toEqual(['error: id already exists: g1']);
    expect(app.processLine('ungroup g1')).toEqual([
      'error: cannot ungroup top-level container: g1',
    ]);
    expect(app.processLine('ungroup r')).toEqual(['error: not a container: r']);
    expect(app.processLine('addto missing r')).toEqual([
      'error: no such container: missing',
    ]);
    expect(app.processLine('addto r r')).toEqual(['error: not a container: r']);
    expect(app.processLine('addto g1 g1')).toEqual([
      'error: cannot move a container into its own descendant: g1',
    ]);
  });
});

describe('file errors and atomicity', () => {
  it('reports unreadable and unwritable files', () => {
    const dir = makeTempDir();
    const missing = join(dir, 'nope.svg');
    const badDir = join(dir, 'missing-dir', 'a.svg');
    const app = new EditorApplication();
    app.processLine('init');

    expect(app.processLine(`read ${missing}`)).toEqual([
      `error: cannot read file: ${missing}`,
    ]);
    expect(app.processLine(`save ${badDir}`)).toEqual([
      `error: cannot write file: ${badDir}`,
    ]);
  });

  it('keeps the current document and history when a read fails', () => {
    const dir = makeTempDir();
    const malformed = join(dir, 'bad.svg');
    writeFileSync(malformed, '<svg><rect></svg>', 'utf8');
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect keep 0 0 10 10');

    expect(app.processLine(`read ${malformed}`)).toEqual([
      `error: cannot parse file: ${malformed}`,
    ]);
    expect(app.processLine('show keep')).toEqual([
      'rect#keep  parent=svg',
      '  x=0 y=0 width=10 height=10',
    ]);
    expect(app.processLine('undo')).toEqual(['rect#keep creation undone']);
  });

  it('does not lock history when a save fails', () => {
    const dir = makeTempDir();
    const badDir = join(dir, 'missing-dir', 'a.svg');
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect r 0 0 10 10');

    expect(app.processLine(`save ${badDir}`)).toEqual([
      `error: cannot write file: ${badDir}`,
    ]);
    expect(app.processLine('undo')).toEqual(['rect#r creation undone']);
  });
});
