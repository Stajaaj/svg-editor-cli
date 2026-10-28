import { Document } from '../../core/Document';
import { EditorError } from '../../errors/EditorError';
import { NumberValue } from '../../util/NumberValue';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class InitCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectRange(args, 0, 2, 'init [w] [h]');
    if (args.length === 1) {
      throw new EditorError('usage: init [w] [h]');
    }

    let width = 800;
    let height = 600;
    if (args.length === 2) {
      width = NumberValue.parse(args[0]!.value);
      height = NumberValue.parse(args[1]!.value);
      if (width <= 0 || height <= 0) {
        throw new EditorError('canvas size must be positive');
      }
    }

    session.open(new Document(width, height), null);
    return `canvas ${NumberValue.format(width)}x${NumberValue.format(height)} created`;
  }
}
