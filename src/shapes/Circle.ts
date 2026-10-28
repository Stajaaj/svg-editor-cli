import { NumberValue } from '../util/NumberValue';
import type { AttributeEntry } from './AttributeEntry';
import { Point } from './Point';
import { Shape } from './Shape';
import type { ShapeState } from './ShapeState';

export class Circle extends Shape {
  private _cx: number;
  private _cy: number;
  private _r: number;

  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);
    this._cx = cx;
    this._cy = cy;
    this._r = r;
    if (fill !== undefined) {
      this.fill = fill;
    }
  }

  get typeName(): string {
    return 'circle';
  }

  get cx(): number {
    return this._cx;
  }

  get cy(): number {
    return this._cy;
  }

  get r(): number {
    return this._r;
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
    this._r = NumberValue.normalize(this._r * factor);
  }

  captureState(): ShapeState {
    const cx = this._cx;
    const cy = this._cy;
    const r = this._r;
    const restoreVisual = this.captureVisualState();
    return {
      restore: () => {
        this._cx = cx;
        this._cy = cy;
        this._r = r;
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
    if (name === 'r') {
      this._r = NumberValue.parse(value);
      return;
    }
    super.setAttribute(name, value);
  }

  geometryAttributes(): AttributeEntry[] {
    return [
      { name: 'cx', value: NumberValue.format(this._cx) },
      { name: 'cy', value: NumberValue.format(this._cy) },
      { name: 'r', value: NumberValue.format(this._r) },
    ];
  }

  treeSummary(): string {
    const summary =
      `cx=${NumberValue.format(this._cx)} cy=${NumberValue.format(this._cy)} ` +
      `r=${NumberValue.format(this._r)}`;
    return this.withVisualSummary(summary);
  }

  toSvg(indent: number): string {
    return (
      `${this.indentOf(indent)}<circle${this.svgIdAttribute()}` +
      ` cx="${NumberValue.format(this._cx)}" cy="${NumberValue.format(this._cy)}"` +
      ` r="${NumberValue.format(this._r)}"${this.svgVisualAttributes()}/>`
    );
  }
}
