import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EditorApplication } from '../src/cli/EditorApplication';
import { makeTempDir, writeOtherSvg } from './support';

const MAIN_TREE = [
  'svg (800x600)',
  '├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff',
  '├── text#title     (20,40) "My Diagram"',
  '└── g#markers',
  '    ├── circle#c1  cx=100 cy=100 r=20 fill=red',
  '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
];

const READ_TREE = [
  'svg (400x300)',
  '├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff',
  '├── text#t1        (10,290) "imported"',
  '├── circle#c1      cx=50 cy=50 r=10',
  '├── g#g1',
  '│   ├── rect#r2    x=0 y=0 w=10 h=10',
  '│   └── circle#c2  cx=5 cy=5 r=2',
  '└── ellipse#e1     cx=1 cy=2 rx=3 ry=4',
];

describe('typical CLI session from the specification', () => {
  it('reproduces commands, tree output, undo/redo, save and read', () => {
    const dir = makeTempDir();
    const demoPath = join(dir, 'demo.svg');
    const otherPath = writeOtherSvg(dir);
    const app = new EditorApplication();

    expect(app.processLine('init 800 600')).toEqual(['canvas 800x600 created']);
    expect(app.processLine('create rect bg 0 0 800 600 #ffffff')).toEqual([
      'rect#bg created',
    ]);
    expect(app.processLine('create text title 20 40 "My Diagram"')).toEqual([
      'text#title created',
    ]);
    expect(app.processLine('create circle c1 100 100 20 red')).toEqual([
      'circle#c1 created',
    ]);
    expect(app.processLine('create rect box 200 80 60 60 #3366ff')).toEqual([
      'rect#box created',
    ]);
    expect(app.processLine('group markers c1 box')).toEqual([
      'g#markers created with 2 children',
    ]);
    expect(app.processLine('tree')).toEqual(MAIN_TREE);

    expect(app.processLine('move c1 30 0')).toEqual([
      'circle#c1 moved to (130,100)',
    ]);
    expect(app.processLine('undo')).toEqual([
      'circle#c1 moved back to (100,100)',
    ]);
    expect(app.processLine('redo')).toEqual(['circle#c1 moved to (130,100)']);

    expect(app.processLine('set title text "My Diagram v2"')).toEqual([
      'text#title updated: text="My Diagram v2"',
    ]);
    expect(app.processLine('undo')).toEqual([
      'text#title updated: text="My Diagram"',
    ]);

    expect(app.processLine('group bad c1 markers')).toEqual([
      'error: cannot group a container into its own descendant: markers',
    ]);
    expect(app.processLine('delete box')).toEqual(['rect#box deleted']);
    expect(app.processLine('undo')).toEqual([
      'rect#box restored into g#markers',
    ]);

    expect(app.processLine(`save ${demoPath}`)).toEqual([
      `saved to ${demoPath} (5 elements)`,
    ]);
    expect(existsSync(demoPath)).toBe(true);
    expect(app.processLine('undo')).toEqual([
      'error: undo not allowed after io command',
    ]);

    expect(app.processLine(`read ${otherPath}`)).toEqual([
      'warning: assigned id rect1 to unnamed <rect>',
      `read ${otherPath} (7 elements)`,
    ]);
    expect(app.processLine('tree')).toEqual(READ_TREE);
  });
});
