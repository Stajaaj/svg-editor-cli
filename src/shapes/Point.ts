import { NumberValue } from '../util/NumberValue';

export class Point {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  format(): string {
    return `(${NumberValue.format(this.x)},${NumberValue.format(this.y)})`;
  }
}
