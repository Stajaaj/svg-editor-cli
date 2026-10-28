import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EditorApplication } from '../src/cli/EditorApplication';
import { ShapeFactory } from '../src/shapes/ShapeFactory';
import { SvgReader } from '../src/io/SvgReader';
import { makeTempDir } from './support';

const MINIMAL_FLOW_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <g id="flow">
    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>
    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>
    <rect id="end" x="250" y="70" width="120" height="60" fill="#f5a623"/>
  </g>
</svg>
`;

describe('SVG serialization', () => {
  it('writes the documented XML format', () => {
    const dir = makeTempDir();
    const path = join(dir, 'flow.svg');
    const app = new EditorApplication();
    app.processLine('init 400 200');
    app.processLine('create g flow');
    app.processLine('create rect start 30 70 120 60 #4a90d9 in flow');
    app.processLine('create line edge 150 100 250 100 black in flow');
    app.processLine('create rect end 250 70 120 60 #f5a623 in flow');

    expect(app.processLine(`save ${path}`)).toEqual([
      `saved to ${path} (4 elements)`,
    ]);
    expect(readFileSync(path, 'utf8')).toBe(MINIMAL_FLOW_SVG);
  });

  it('round-trips through read and save without losing structure', () => {
    const dir = makeTempDir();
    const source = join(dir, 'source.svg');
    const target = join(dir, 'target.svg');
    writeFileSync(source, MINIMAL_FLOW_SVG, 'utf8');
    const app = new EditorApplication();

    expect(app.processLine(`read ${source}`)).toEqual([
      `read ${source} (4 elements)`,
    ]);
    expect(app.processLine('tree')).toEqual([
      'svg (400x200)',
      '└── g#flow',
      '    ├── rect#start  x=30 y=70 w=120 h=60 fill=#4a90d9',
      '    ├── line#edge   (150,100) -> (250,100)',
      '    └── rect#end    x=250 y=70 w=120 h=60 fill=#f5a623',
    ]);
    expect(app.processLine(`save ${target}`)).toEqual([
      `saved to ${target} (4 elements)`,
    ]);
    expect(readFileSync(target, 'utf8')).toBe(MINIMAL_FLOW_SVG);
  });

  it('saves to the read path when no path is given', () => {
    const dir = makeTempDir();
    const source = join(dir, 'source.svg');
    writeFileSync(source, MINIMAL_FLOW_SVG, 'utf8');
    const app = new EditorApplication();
    app.processLine(`read ${source}`);
    expect(app.processLine('save')).toEqual([
      `saved to ${source} (4 elements)`,
    ]);
    expect(readFileSync(source, 'utf8')).toBe(MINIMAL_FLOW_SVG);
  });

  it('accepts a UTF-8 BOM at the start of the file', () => {
    const dir = makeTempDir();
    const path = join(dir, 'bom.svg');
    writeFileSync(path, `\uFEFF${MINIMAL_FLOW_SVG}`, 'utf8');
    const reader = new SvgReader(new ShapeFactory());
    const result = reader.readFile(path);
    expect(result.document.elementCount).toBe(4);
    expect(result.warnings).toEqual([]);
  });

  it('escapes text content and restores it on read', () => {
    const dir = makeTempDir();
    const path = join(dir, 'escape.svg');
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create text t 10 20 "A & B < C"');
    app.processLine(`save ${path}`);
    expect(readFileSync(path, 'utf8')).toContain('A &amp; B &lt; C');

    const reader = new SvgReader(new ShapeFactory());
    const result = reader.readFile(path);
    const tree = app.processLine('tree');
    expect(tree[0]).toBe('svg (800x600)');

    app.processLine(`read ${path}`);
    expect(app.processLine('show t')).toEqual([
      'text#t  parent=svg',
      '  x=10 y=20',
      '  text="A & B < C"',
    ]);
    expect(result.document.elementCount).toBe(1);
  });
});

describe('SVG parsing', () => {
  it('assigns missing ids per tag, avoiding explicit ids', () => {
    const dir = makeTempDir();
    const path = join(dir, 'unnamed.svg');
    writeFileSync(
      path,
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect id="rect1" width="10" height="10"/>
  <rect width="20" height="20"/>
  <g>
    <circle cx="5" cy="5" r="2"/>
  </g>
</svg>
`,
      'utf8',
    );
    const app = new EditorApplication();
    expect(app.processLine(`read ${path}`)).toEqual([
      'warning: assigned id rect2 to unnamed <rect>',
      'warning: assigned id g1 to unnamed <g>',
      'warning: assigned id circle1 to unnamed <circle>',
      `read ${path} (4 elements)`,
    ]);
    expect(app.processLine('tree')).toEqual([
      'svg (100x100)',
      '├── rect#rect1          x=0 y=0 w=10 h=10',
      '├── rect#rect2          x=0 y=0 w=20 h=20',
      '└── g#g1',
      '    └── circle#circle1  cx=5 cy=5 r=2',
    ]);
  });

  it('rejects duplicate ids in the file', () => {
    const dir = makeTempDir();
    const path = join(dir, 'duplicate.svg');
    writeFileSync(
      path,
      `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
  <rect id="dup" width="1" height="1"/>
  <circle id="dup" cx="1" cy="1" r="1"/>
</svg>`,
      'utf8',
    );
    const reader = new SvgReader(new ShapeFactory());
    expect(() => reader.readFile(path)).toThrow('duplicate id in file: dup');
    const app = new EditorApplication();
    expect(app.processLine(`read ${path}`)).toEqual([
      'error: duplicate id in file: dup',
    ]);
  });

  it('warns about unsupported elements but keeps parsing the rest', () => {
    const dir = makeTempDir();
    const path = join(dir, 'unsupported.svg');
    writeFileSync(
      path,
      `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
  <title>demo</title>
  <path d="M0 0 L10 10"/>
  <rect id="r" width="10" height="10"/>
</svg>`,
      'utf8',
    );
    const app = new EditorApplication();
    expect(app.processLine(`read ${path}`)).toEqual([
      'warning: skipped unsupported element: <path>',
      `read ${path} (1 element)`,
    ]);
  });

  it('falls back to the viewBox for canvas dimensions', () => {
    const dir = makeTempDir();
    const path = join(dir, 'viewbox.svg');
    writeFileSync(
      path,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
  <rect id="r" width="10" height="10"/>
</svg>`,
      'utf8',
    );
    const app = new EditorApplication();
    app.processLine(`read ${path}`);
    expect(app.processLine('canvas')).toEqual(['canvas 320x240']);
  });

  it('rejects non-svg roots', () => {
    const dir = makeTempDir();
    const path = join(dir, 'not-svg.svg');
    writeFileSync(path, '<html><body>nope</body></html>', 'utf8');
    const app = new EditorApplication();
    expect(app.processLine(`read ${path}`)).toEqual([
      `error: cannot parse file: ${path}`,
    ]);
  });
});
