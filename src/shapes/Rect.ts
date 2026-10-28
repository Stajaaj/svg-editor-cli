import { NumberValue } from '../util/NumberValue';
import type { AttributeEntry } from './AttributeEntry';
import { Point } from './Point';
import { Shape } from './Shape';
import type { ShapeState } from './ShapeState';

export class Rect extends Shape {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;

  constructor(id: string, x: number, y: number, width: number, height: number, fill?: string) {
    super(id);
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    if (fill !== undefined) {
      this.fill = fill;
    }
  }

  get typeName(): string {
    return 'rect';
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  override get anchor(): Point {
    return new Point(this._x, this._y);
  }

  translate(dx: number, dy: number): void {
    this._x = NumberValue.normalize(this._x + dx);
    this._y = NumberValue.normalize(this._y + dy);
  }

  scale(factor: number): void {
    this._x = NumberValue.normalize(this._x * factor);
    this._y = NumberValue.normalize(this._y * factor);
    this._width = NumberValue.normalize(this._width * factor);
    this._height = NumberValue.normalize(this._height * factor);
  }

  captureState(): ShapeState {
    const x = this._x;
    const y = this._y;
    const width = this._width;
    const height = this._height;
    const restoreVisual = this.captureVisualState();
    return {
      restore: () => {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        restoreVisual();
      },
    };
  }

  setAttribute(name: string, value: string): void {
    if (name === 'x') {
      this._x = NumberValue.parse(value);
      return;
    }
    if (name === 'y') {
      this._y = NumberValue.parse(value);
      return;
    }
    if (name === 'width') {
      this._width = NumberValue.parse(value);
      return;
    }
    if (name === 'height') {
      this._height = NumberValue.parse(value);
      return;
    }
    super.setAttribute(name, value);
  }

  geometryAttributes(): AttributeEntry[] {
    return [
      { name: 'x', value: NumberValue.format(this._x) },
      { name: 'y', value: NumberValue.format(this._y) },
      { name: 'width', value: NumberValue.format(this._width) },
      { name: 'height', value: NumberValue.format(this._height) },
    ];
  }

  treeSummary(): string {
    const summary =
      `x=${NumberValue.format(this._x)} y=${NumberValue.format(this._y)} ` +
      `w=${NumberValue.format(this._width)} h=${NumberValue.format(this._height)}`;
    return this.withVisualSummary(summary);
  }

  toSvg(indent: number): string {
    return (
      `${this.indentOf(indent)}<rect${this.svgIdAttribute()}` +
      ` x="${NumberValue.format(this._x)}" y="${NumberValue.format(this._y)}"` +
      ` width="${NumberValue.format(this._width)}" height="${NumberValue.format(this._height)}"` +
      `${this.svgVisualAttributes()}/>`
    );
  }
}
