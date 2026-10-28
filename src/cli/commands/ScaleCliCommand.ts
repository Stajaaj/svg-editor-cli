import { ScaleShapesCommand } from '../../commands/ScaleShapesCommand';
import { EditorError } from '../../errors/EditorError';
import { NumberValue } from '../../util/NumberValue';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ScaleCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 2, 'scale <id> <factor>');
    const document = session.document;
    const shape = document.requireShape(args[0]!.value);
    const factor = NumberValue.parse(args[1]!.value);
    if (factor <= 0) {
      throw new EditorError('scale factor must be positive');
    }
    return session.history.execute(new ScaleShapesCommand(shape, factor));
  }
}
