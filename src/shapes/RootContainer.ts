import { NumberValue } from '../util/NumberValue';
import { Container } from './Container';

export class RootContainer extends Container {
  private _width: number;
  private _height: number;

  constructor(width = 800, height = 600) {
    super('svg');
    this._width = width;
    this._height = height;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get typeName(): string {
    return 'svg';
  }

  override get displayName(): string {
    return 'svg';
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  treeSummary(): string {
    return `(${NumberValue.format(this._width)}x${NumberValue.format(this._height)})`;
  }

  toSvg(indent: number): string {
    const padding = this.indentOf(indent);
    const width = NumberValue.format(this._width);
    const height = NumberValue.format(this._height);
    const open =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"` +
      ` viewBox="0 0 ${width} ${height}"`;
    if (this.childCount === 0) {
      return `${padding}${open}/>`;
    }
    const inner = this.children.map((child) => child.toSvg(indent + 1)).join('\n');
    return `${padding}${open}>\n${inner}\n${padding}</svg>`;
  }
}
