import { EditorError } from '../errors/EditorError';

export class NumberValue {
  private static readonly PRECISION = 12;

  static parse(raw: string): number {
    if (raw.trim() === '') {
      throw new EditorError(`invalid number: ${raw}`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new EditorError(`invalid number: ${raw}`);
    }
    return value;
  }

  static format(value: number): string {
    return String(this.normalize(value));
  }

  static normalize(value: number): number {
    if (!Number.isFinite(value)) {
      throw new EditorError(`invalid number: ${value}`);
    }
    const rounded = Number(value.toPrecision(this.PRECISION));
    return Object.is(rounded, -0) ? 0 : rounded;
  }
}
