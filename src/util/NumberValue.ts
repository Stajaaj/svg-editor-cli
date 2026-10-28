import { EditorError } from '../errors/EditorError';

export class NumberValue {
  private static readonly SCALE = 1_000_000;

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
    if (!Number.isFinite(value)) {
      throw new EditorError(`invalid number: ${value}`);
    }
    const rounded = Math.round(value * this.SCALE) / this.SCALE;
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }

  static normalize(value: number): number {
    const rounded = Math.round(value * this.SCALE) / this.SCALE;
    return Object.is(rounded, -0) ? 0 : rounded;
  }
}
