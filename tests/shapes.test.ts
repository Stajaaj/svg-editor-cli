import { describe, expect, it } from 'vitest';
import { Circle } from '../src/shapes/Circle';
import { Group } from '../src/shapes/Group';
import { Rect } from '../src/shapes/Rect';
import { Text } from '../src/shapes/Text';

describe('shape geometry', () => {
  it('translates and scales leaf geometry', () => {
    const rect = new Rect('r', 10, 20, 30, 40, 'red');
    rect.translate(5, -5);
    expect(rect.geometryAttributes()).toEqual([
      { name: 'x', value: '15' },
      { name: 'y', value: '15' },
      { name: 'width', value: '30' },
      { name: 'height', value: '40' },
    ]);
    rect.scale(2);
    expect(rect.geometryAttributes()).toEqual([
      { name: 'x', value: '30' },
      { name: 'y', value: '30' },
      { name: 'width', value: '60' },
      { name: 'height', value: '80' },
    ]);
    expect(rect.anchor?.format()).toBe('(30,30)');
  });

  it('recurses into containers and restores exact state', () => {
    const outer = new Group('outer');
    const inner = new Group('inner');
    const rect = new Rect('r', 1, 2, 3, 4);
    const circle = new Circle('c', 5, 6, 7);
    const text = new Text('t', 8, 9, 'hello');
    inner.insert(circle);
    outer.insert(inner);
    outer.insert(rect);
    outer.insert(text);

    outer.translate(10, 10);
    expect(rect.anchor?.format()).toBe('(11,12)');
    expect(circle.anchor?.format()).toBe('(15,16)');
    expect(text.anchor?.format()).toBe('(18,19)');

    const state = outer.captureState();
    outer.scale(3);
    expect(rect.anchor?.format()).toBe('(33,36)');
    expect(text.content).toBe('hello');
    state.restore();
    expect(rect.anchor?.format()).toBe('(11,12)');
    expect(circle.geometryAttributes()).toEqual([
      { name: 'cx', value: '15' },
      { name: 'cy', value: '16' },
      { name: 'r', value: '7' },
    ]);
    expect(text.anchor?.format()).toBe('(18,19)');
  });

  it('keeps text content and container membership', () => {
    const group = new Group('g');
    const text = new Text('t', 1, 2, 'a b');
    group.insert(text);
    expect(text.parent).toBe(group);
    expect(group.children).toEqual([text]);
    expect(group.remove(text)).toBe(0);
    expect(text.parent).toBeNull();
    expect(group.children).toEqual([]);
    expect(group.treeSummary()).toBe('');
    group.setAttribute('fill', 'red');
    expect(group.treeSummary()).toBe('fill=red');
  });
});
