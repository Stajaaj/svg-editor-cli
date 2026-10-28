import { NumberValue } from '../util/NumberValue';
import { XmlText } from '../util/XmlText';
import type { AttributeEntry } from './AttributeEntry';
import { Point } from './Point';
import { Shape } from './Shape';
import type { ShapeState } from './ShapeState';

export class Text extends Shape {
  private _x: number;
  private _y: number;
  private _content: string;

  constructor(id: string, x: number, y: number, content: string, fill?: string) {
    super(id);
    this._x = x;
    this._y = y;
    this._content = content;
    if (fill !== undefined) {
      this.fill = fill;
    }
  }

  get typeName(): string {
    return 'text';
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get content(): string {
    return this._content;
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
  }

  captureState(): ShapeState {
    const x = this._x;
    const y = this._y;
    const content = this._content;
    const restoreVisual = this.captureVisualState();
    return {
      restore: () => {
        this._x = x;
        this._y = y;
        this._content = content;
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
    if (name === 'text') {
      this._content = value;
      return;
    }
    super.setAttribute(name, value);
  }

  geometryAttributes(): AttributeEntry[] {
    return [
      { name: 'x', value: NumberValue.format(this._x) },
      { name: 'y', value: NumberValue.format(this._y) },
    ];
  }

  override contentAttributes(): AttributeEntry[] {
    return [{ name: 'text', value: `"${this._content}"` }];
  }

  treeSummary(): string {
    return this.withVisualSummary(
      `${this.anchor!.format()} "${this._content}"`,
    );
  }

  toSvg(indent: number): string {
    return (
      `${this.indentOf(indent)}<text${this.svgIdAttribute()}` +
      ` x="${NumberValue.format(this._x)}" y="${NumberValue.format(this._y)}"` +
      `${this.svgVisualAttributes()}>${XmlText.escapeText(this._content)}</text>`
    );
  }
}
