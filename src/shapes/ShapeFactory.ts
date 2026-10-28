import { EditorError } from '../errors/EditorError';
import { NumberValue } from '../util/NumberValue';
import { Circle } from './Circle';
import { Ellipse } from './Ellipse';
import { Group } from './Group';
import { Line } from './Line';
import { Rect } from './Rect';
import type { Shape } from './Shape';
import { Text } from './Text';

type AttributeMap = Record<string, string>;

export class ShapeFactory {
  private static readonly KNOWN_TYPES = ['rect', 'circle', 'ellipse', 'line', 'text', 'g'];

  isKnownType(type: string): boolean {
    return ShapeFactory.KNOWN_TYPES.includes(type);
  }

  // Allow-listed name dispatch #2 (type name -> class). Becomes a plugin registry in phase 2.
  createFromCommand(type: string, id: string, params: readonly string[]): Shape {
    if (type === 'rect') {
      this.requireCount(params, 4, 5, 'rect <id> <x> <y> <w> <h> [fill]');
      const shape = new Rect(
        id,
        NumberValue.parse(params[0]!),
        NumberValue.parse(params[1]!),
        NumberValue.parse(params[2]!),
        NumberValue.parse(params[3]!),
      );
      if (params[4] !== undefined) {
        shape.setAttribute('fill', params[4]);
      }
      return shape;
    }
    if (type === 'circle') {
      this.requireCount(params, 3, 4, 'circle <id> <cx> <cy> <r> [fill]');
      const shape = new Circle(
        id,
        NumberValue.parse(params[0]!),
        NumberValue.parse(params[1]!),
        NumberValue.parse(params[2]!),
      );
      if (params[3] !== undefined) {
        shape.setAttribute('fill', params[3]);
      }
      return shape;
    }
    if (type === 'ellipse') {
      this.requireCount(params, 4, 5, 'ellipse <id> <cx> <cy> <rx> <ry> [fill]');
      const shape = new Ellipse(
        id,
        NumberValue.parse(params[0]!),
        NumberValue.parse(params[1]!),
        NumberValue.parse(params[2]!),
        NumberValue.parse(params[3]!),
      );
      if (params[4] !== undefined) {
        shape.setAttribute('fill', params[4]);
      }
      return shape;
    }
    if (type === 'line') {
      this.requireCount(params, 4, 5, 'line <id> <x1> <y1> <x2> <y2> [stroke]');
      const shape = new Line(
        id,
        NumberValue.parse(params[0]!),
        NumberValue.parse(params[1]!),
        NumberValue.parse(params[2]!),
        NumberValue.parse(params[3]!),
      );
      if (params[4] !== undefined) {
        shape.setAttribute('stroke', params[4]);
      }
      return shape;
    }
    if (type === 'text') {
      this.requireCount(params, 3, 3, 'text <id> <x> <y> "content"');
      return new Text(
        id,
        NumberValue.parse(params[0]!),
        NumberValue.parse(params[1]!),
        params[2]!,
      );
    }
    if (type === 'g') {
      this.requireCount(params, 0, 0, 'g <id>');
      return new Group(id);
    }
    throw this.unknownType(type);
  }

  createFromAttributes(
    type: string,
    id: string,
    attributes: AttributeMap,
    textContent = '',
  ): Shape {
    let shape: Shape;
    if (type === 'rect') {
      shape = new Rect(
        id,
        this.numberAttribute(attributes, 'x'),
        this.numberAttribute(attributes, 'y'),
        this.numberAttribute(attributes, 'width'),
        this.numberAttribute(attributes, 'height'),
      );
    } else if (type === 'circle') {
      shape = new Circle(
        id,
        this.numberAttribute(attributes, 'cx'),
        this.numberAttribute(attributes, 'cy'),
        this.numberAttribute(attributes, 'r'),
      );
    } else if (type === 'ellipse') {
      shape = new Ellipse(
        id,
        this.numberAttribute(attributes, 'cx'),
        this.numberAttribute(attributes, 'cy'),
        this.numberAttribute(attributes, 'rx'),
        this.numberAttribute(attributes, 'ry'),
      );
    } else if (type === 'line') {
      shape = new Line(
        id,
        this.numberAttribute(attributes, 'x1'),
        this.numberAttribute(attributes, 'y1'),
        this.numberAttribute(attributes, 'x2'),
        this.numberAttribute(attributes, 'y2'),
      );
    } else if (type === 'text') {
      shape = new Text(
        id,
        this.numberAttribute(attributes, 'x'),
        this.numberAttribute(attributes, 'y'),
        textContent,
      );
    } else if (type === 'g') {
      shape = new Group(id);
    } else {
      throw this.unknownType(type);
    }
    this.applyVisualAttributes(shape, attributes);
    return shape;
  }

  private requireCount(
    params: readonly string[],
    min: number,
    max: number,
    usage: string,
  ): void {
    if (params.length < min || params.length > max) {
      throw new EditorError(`usage: create ${usage}`);
    }
  }

  private numberAttribute(attributes: AttributeMap, name: string): number {
    const raw = attributes[name];
    if (raw === undefined || raw === '') {
      return 0;
    }
    return NumberValue.parse(raw);
  }

  private applyVisualAttributes(shape: Shape, attributes: AttributeMap): void {
    for (const name of ['fill', 'stroke', 'stroke-width']) {
      const value = attributes[name];
      if (value !== undefined) {
        shape.setAttribute(name, value);
      }
    }
  }

  private unknownType(type: string): EditorError {
    return new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
  }
}
