import { EditorError } from '../errors/EditorError';
import type { Token } from './Token';

export class CommandArguments {
  static values(args: readonly Token[]): string[] {
    return args.map((token) => token.value);
  }

  static expectCount(
    args: readonly Token[],
    count: number,
    usage: string,
  ): void {
    if (args.length !== count) {
      throw new EditorError(`usage: ${usage}`);
    }
  }

  static expectRange(
    args: readonly Token[],
    min: number,
    max: number,
    usage: string,
  ): void {
    if (args.length < min || args.length > max) {
      throw new EditorError(`usage: ${usage}`);
    }
  }
}
