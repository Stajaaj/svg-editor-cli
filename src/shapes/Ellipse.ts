import { NumberValue } from '../util/NumberValue';
import type { AttributeEntry } from './AttributeEntry';
import { Point } from './Point';
import { Shape } from './Shape';
import type { ShapeState } from './ShapeState';

export class Ellipse extends Shape {
  private _cx: number;
  private _cy: number;
  private _rx: number;
  private _ry: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id);
    this._cx = cx;
    this._cy = cy;
    this._rx = rx;
    this._ry = ry;
    if (fill !== undefined) {
      this.fill = fill;
    }
  }

  get typeName(): string {
    return 'ellipse';
  }

  get cx(): number {
    return this._cx;
  }

  get cy(): number {
    return this._cy;
  }

  get rx(): number {
    return this._rx;
  }

  get ry(): number {
    return this._ry;
  }

  override get anchor(): Point {
    return new Point(this._cx, this._cy);
  }

  translate(dx: number, dy: number): void {
    this._cx = NumberValue.normalize(this._cx + dx);
    this._cy = NumberValue.normalize(this._cy + dy);
  }

  scale(factor: number): void {
    this._cx = NumberValue.normalize(this._cx * factor);
    this._cy = NumberValue.normalize(this._cy * factor);
    this._rx = NumberValue.normalize(this._rx * factor);
    this._ry = NumberValue.normalize(this._ry * factor);
  }

  captureState(): ShapeState {
    const cx = this._cx;
    const cy = this._cy;
    const rx = this._rx;
    const ry = this._ry;
    const restoreVisual = this.captureVisualState();
    return {
      restore: () => {
        this._cx = cx;
        this._cy = cy;
        this._rx = rx;
        this._ry = ry;
        restoreVisual();
      },
    };
  }

  setAttribute(name: string, value: string): void {
    if (name === 'cx') {
      this._cx = NumberValue.parse(value);
      return;
    }
    if (name === 'cy') {
      this._cy = NumberValue.parse(value);
      return;
    }
    if (name === 'rx') {
      this._rx = NumberValue.parse(value);
      return;
    }
    if (name === 'ry') {
      this._ry = NumberValue.parse(value);
      return;
    }
    super.setAttribute(name, value);
  }

  geometryAttributes(): AttributeEntry[] {
    return [
      { name: 'cx', value: NumberValue.format(this._cx) },
      { name: 'cy', value: NumberValue.format(this._cy) },
      { name: 'rx', value: NumberValue.format(this._rx) },
      { name: 'ry', value: NumberValue.format(this._ry) },
    ];
  }

  treeSummary(): string {
    const summary =
      `cx=${NumberValue.format(this._cx)} cy=${NumberValue.format(this._cy)} ` +
      `rx=${NumberValue.format(this._rx)} ry=${NumberValue.format(this._ry)}`;
    return this.withVisualSummary(summary);
  }

  toSvg(indent: number): string {
    return (
      `${this.indentOf(indent)}<ellipse${this.svgIdAttribute()}` +
      ` cx="${NumberValue.format(this._cx)}" cy="${NumberValue.format(this._cy)}"` +
      ` rx="${NumberValue.format(this._rx)}" ry="${NumberValue.format(this._ry)}"` +
      `${this.svgVisualAttributes()}/>`
    );
  }
}
