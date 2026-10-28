import { describe, expect, it } from 'vitest';
import { EditorApplication } from '../src/cli/EditorApplication';

function rootOrder(app: EditorApplication): string[] {
  return app
    .processLine('tree')
    .slice(1)
    .filter((line) => /^[├└]── /.test(line))
    .map((line) => line.match(/^[├└]── (\S+)/)![1]!);
}

describe('composite structure operations', () => {
  it('groups in document order, places the group at the first slot and undoes cleanly', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect a 0 0 10 10');
    app.processLine('create rect b 10 10 10 10');
    app.processLine('create rect c 20 20 10 10');

    expect(app.processLine('group g1 c a')).toEqual([
      'g#g1 created with 2 children',
    ]);
    expect(rootOrder(app)).toEqual(['g#g1', 'rect#b']);
    const subtree = app.processLine('tree g1');
    expect(subtree[0]).toBe('g#g1');
    expect(subtree[1]).toContain('rect#a');
    expect(subtree[2]).toContain('rect#c');
    expect(app.processLine('show a')).toEqual([
      'rect#a  parent=g#g1',
      '  x=0 y=0 width=10 height=10',
    ]);

    expect(app.processLine('undo')).toEqual([
      expect.stringContaining('g#g1 removed'),
    ]);
    expect(rootOrder(app)).toEqual(['rect#a', 'rect#b', 'rect#c']);
    expect(app.processLine('redo')).toEqual([
      'g#g1 created with 2 children',
    ]);
    expect(rootOrder(app)).toEqual(['g#g1', 'rect#b']);
  });

  it('moves shapes into containers, ungroups nested containers and restores both', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create g outer');
    app.processLine('create rect r1 1 1 5 5 in outer');
    app.processLine('create rect r2 6 6 5 5 in outer');
    app.processLine('create g top');
    app.processLine('addto top outer');

    expect(app.processLine('show outer')).toEqual([
      'g#outer  parent=g#top',
    ]);
    expect(app.processLine('ungroup outer')).toEqual([
      'g#outer ungrouped (2 children)',
    ]);
    expect(app.processLine('show r1')).toEqual([
      'rect#r1  parent=g#top',
      '  x=1 y=1 width=5 height=5',
    ]);
    expect(app.processLine('undo')).toEqual([
      'g#outer restored with 2 children',
    ]);
    expect(app.processLine('show r1')).toEqual([
      'rect#r1  parent=g#outer',
      '  x=1 y=1 width=5 height=5',
    ]);
    expect(app.processLine('undo')).toEqual(['g#outer restored to canvas']);
    expect(app.processLine('show outer')).toEqual(['g#outer  parent=svg']);
  });

  it('promotes nested containers as whole subtrees when ungrouping', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create g outer');
    app.processLine('create g inner in outer');
    app.processLine('create rect a 1 2 3 4 in inner');
    app.processLine('create g top');
    app.processLine('addto top outer');

    expect(app.processLine('ungroup outer')).toEqual([
      'g#outer ungrouped (1 child)',
    ]);
    expect(app.processLine('show inner')).toEqual(['g#inner  parent=g#top']);
    expect(app.processLine('show a')).toEqual([
      'rect#a  parent=g#inner',
      '  x=1 y=2 width=3 height=4',
    ]);
    expect(app.processLine('undo')).toEqual([
      'g#outer restored with 1 child',
    ]);
    expect(app.processLine('show inner')).toEqual(['g#inner  parent=g#outer']);
  });

  it('rejects addto cycles', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create g g1');
    app.processLine('create g g2 in g1');
    expect(app.processLine('addto g2 g1')).toEqual([
      'error: cannot move a container into its own descendant: g1',
    ]);
  });

  it('changes z-order and restores the previous index on undo', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect r1 0 0 10 10');
    app.processLine('create rect r2 0 0 10 10');
    app.processLine('create rect r3 0 0 10 10');

    expect(app.processLine('front r2')).toEqual(['rect#r2 moved to front']);
    expect(rootOrder(app)).toEqual(['rect#r1', 'rect#r3', 'rect#r2']);
    expect(app.processLine('undo')).toEqual(['rect#r2 z-order restored']);
    expect(rootOrder(app)).toEqual(['rect#r1', 'rect#r2', 'rect#r3']);

    expect(app.processLine('back r2')).toEqual(['rect#r2 moved to back']);
    expect(rootOrder(app)).toEqual(['rect#r2', 'rect#r1', 'rect#r3']);
    expect(app.processLine('redo')).toEqual([
      'error: nothing to redo',
    ]);
  });

  it('deletes subtrees and restores ids and structure on undo', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create g g1');
    app.processLine('create rect a 1 1 5 5 in g1');

    expect(app.processLine('delete g1')).toEqual(['g#g1 deleted']);
    expect(app.processLine('show a')).toEqual(['error: no such shape: a']);
    expect(app.processLine('undo')).toEqual(['g#g1 restored to canvas']);
    expect(app.processLine('show a')).toEqual([
      'rect#a  parent=g#g1',
      '  x=1 y=1 width=5 height=5',
    ]);
    expect(app.processLine('redo')).toEqual(['g#g1 deleted']);
  });

  it('applies move and scale recursively to containers', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create g g1');
    app.processLine('create rect r 10 20 30 40 red in g1');
    app.processLine('create line l 0 0 10 10 black in g1');
    app.processLine('create text t 5 6 "hi" in g1');

    expect(app.processLine('scale g1 2')).toEqual(['g#g1 scaled by 2']);
    expect(app.processLine('show r')).toEqual([
      'rect#r  parent=g#g1',
      '  x=20 y=40 width=60 height=80',
      '  fill=red',
    ]);
    expect(app.processLine('show l')).toEqual([
      'line#l  parent=g#g1',
      '  x1=0 y1=0 x2=20 y2=20',
      '  stroke=black',
    ]);
    expect(app.processLine('show t')).toEqual([
      'text#t  parent=g#g1',
      '  x=10 y=12',
      '  text="hi"',
    ]);
    expect(app.processLine('undo')).toEqual(['g#g1 scaled back']);
    expect(app.processLine('show r')).toContain('  x=10 y=20 width=30 height=40');

    expect(app.processLine('move g1 5 -5')).toEqual(['g#g1 moved by (5,-5)']);
    expect(app.processLine('show r')).toContain('  x=15 y=15 width=30 height=40');
    expect(app.processLine('undo')).toEqual(['g#g1 moved back by (-5,5)']);
    expect(app.processLine('show r')).toContain('  x=10 y=20 width=30 height=40');
  });
});

describe('create in-clause and set whitelist', () => {
  it('treats shape ids as case-sensitive', () => {
    const app = new EditorApplication();
    app.processLine('init');
    expect(app.processLine('create rect R 0 0 10 10')).toEqual(['rect#R created']);
    expect(app.processLine('create rect r 1 1 2 2')).toEqual(['rect#r created']);
    expect(app.processLine('show R')).toEqual([
      'rect#R  parent=svg',
      '  x=0 y=0 width=10 height=10',
    ]);
    expect(app.processLine('show r')).toEqual([
      'rect#r  parent=svg',
      '  x=1 y=1 width=2 height=2',
    ]);
  });

  it('distinguishes quoted "in" text from the in-clause', () => {
    const app = new EditorApplication();
    app.processLine('init');
    expect(app.processLine('create text t 1 2 "in"')).toEqual(['text#t created']);
    expect(app.processLine('show t')).toEqual([
      'text#t  parent=svg',
      '  x=1 y=2',
      '  text="in"',
    ]);

    app.processLine('create g holder');
    expect(app.processLine('create text t2 1 2 "in" in holder')).toEqual([
      'text#t2 created in g#holder',
    ]);
    expect(app.processLine('show t2')).toContain('  text="in"');
    expect(app.processLine('create text t3 1 2 in holder')).toEqual([
      'error: usage: create text <id> <x> <y> "content"',
    ]);
  });

  it('supports visual and per-type geometry attributes', () => {
    const app = new EditorApplication();
    app.processLine('init');
    app.processLine('create rect r 0 0 10 10');
    app.processLine('create circle c 0 0 10');
    app.processLine('create ellipse e 0 0 10 5');
    app.processLine('create line l 0 0 10 10');
    app.processLine('create text t 0 0 "old"');
    app.processLine('create g g1');

    expect(app.processLine('set r width 20')).toEqual([
      'rect#r updated: width=20',
    ]);
    expect(app.processLine('set c r 30')).toEqual(['circle#c updated: r=30']);
    expect(app.processLine('set e ry 9')).toEqual(['ellipse#e updated: ry=9']);
    expect(app.processLine('set l x2 50')).toEqual(['line#l updated: x2=50']);
    expect(app.processLine('set t text "new label"')).toEqual([
      'text#t updated: text="new label"',
    ]);
    expect(app.processLine('set g1 fill red')).toEqual(['g#g1 updated: fill=red']);
    expect(app.processLine('set r fill red')).toEqual([
      'rect#r updated: fill=red',
    ]);
    expect(app.processLine('set r stroke black')).toEqual([
      'rect#r updated: stroke=black',
    ]);
    expect(app.processLine('set r stroke-width 2')).toEqual([
      'rect#r updated: stroke-width=2',
    ]);
    expect(app.processLine('show r')).toEqual([
      'rect#r  parent=svg',
      '  x=0 y=0 width=20 height=10',
      '  fill=red stroke=black stroke-width=2',
    ]);

    expect(app.processLine('set r text hi')).toEqual([
      'error: unknown attribute: text',
    ]);
    expect(app.processLine('set c x 1')).toEqual([
      'error: unknown attribute: x',
    ]);
    expect(app.processLine('undo')).toEqual([
      'rect#r updated: stroke-width=(none)',
    ]);
    expect(app.processLine('show r')).toEqual([
      'rect#r  parent=svg',
      '  x=0 y=0 width=20 height=10',
      '  fill=red stroke=black',
    ]);
  });
});
