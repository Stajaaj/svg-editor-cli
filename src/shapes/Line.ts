import { NumberValue } from '../util/NumberValue';
import type { AttributeEntry } from './AttributeEntry';
import { Point } from './Point';
import { Shape } from './Shape';
import type { ShapeState } from './ShapeState';

export class Line extends Shape {
  private _x1: number;
  private _y1: number;
  private _x2: number;
  private _y2: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id);
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
    if (stroke !== undefined) {
      this.stroke = stroke;
    }
  }

  get typeName(): string {
    return 'line';
  }

  override get anchor(): Point {
    return new Point(this._x1, this._y1);
  }

  translate(dx: number, dy: number): void {
    this._x1 = NumberValue.normalize(this._x1 + dx);
    this._y1 = NumberValue.normalize(this._y1 + dy);
    this._x2 = NumberValue.normalize(this._x2 + dx);
    this._y2 = NumberValue.normalize(this._y2 + dy);
  }

  scale(factor: number): void {
    this._x1 = NumberValue.normalize(this._x1 * factor);
    this._y1 = NumberValue.normalize(this._y1 * factor);
    this._x2 = NumberValue.normalize(this._x2 * factor);
    this._y2 = NumberValue.normalize(this._y2 * factor);
  }

  captureState(): ShapeState {
    const x1 = this._x1;
    const y1 = this._y1;
    const x2 = this._x2;
    const y2 = this._y2;
    const restoreVisual = this.captureVisualState();
    return {
      restore: () => {
        this._x1 = x1;
        this._y1 = y1;
        this._x2 = x2;
        this._y2 = y2;
        restoreVisual();
      },
    };
  }

  setAttribute(name: string, value: string): void {
    if (name === 'x1') {
      this._x1 = NumberValue.parse(value);
      return;
    }
    if (name === 'y1') {
      this._y1 = NumberValue.parse(value);
      return;
    }
    if (name === 'x2') {
      this._x2 = NumberValue.parse(value);
      return;
    }
    if (name === 'y2') {
      this._y2 = NumberValue.parse(value);
      return;
    }
    super.setAttribute(name, value);
  }

  geometryAttributes(): AttributeEntry[] {
    return [
      { name: 'x1', value: NumberValue.format(this._x1) },
      { name: 'y1', value: NumberValue.format(this._y1) },
      { name: 'x2', value: NumberValue.format(this._x2) },
      { name: 'y2', value: NumberValue.format(this._y2) },
    ];
  }

  treeSummary(): string {
    return this.withVisualSummary(
      `${this.anchor!.format()} -> ${new Point(this._x2, this._y2).format()}`,
    );
  }

  toSvg(indent: number): string {
    return (
      `${this.indentOf(indent)}<line${this.svgIdAttribute()}` +
      ` x1="${NumberValue.format(this._x1)}" y1="${NumberValue.format(this._y1)}"` +
      ` x2="${NumberValue.format(this._x2)}" y2="${NumberValue.format(this._y2)}"` +
      `${this.svgVisualAttributes()}/>`
    );
  }
}
