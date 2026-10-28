import { EditorError } from '../../errors/EditorError';
import { NumberValue } from '../../util/NumberValue';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class CanvasCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectRange(args, 0, 2, 'canvas [w] [h]');
    const document = session.document;
    if (args.length === 0) {
      return (
        `canvas ${NumberValue.format(document.width)}` +
        `x${NumberValue.format(document.height)}`
      );
    }
    if (args.length === 1) {
      throw new EditorError('usage: canvas [w] [h]');
    }

    const width = NumberValue.parse(args[0]!.value);
    const height = NumberValue.parse(args[1]!.value);
    if (width <= 0 || height <= 0) {
      throw new EditorError('canvas size must be positive');
    }
    document.resize(width, height);
    session.history.markIoCommand();
    return (
      `canvas resized to ${NumberValue.format(width)}` +
      `x${NumberValue.format(height)}`
    );
  }
}
