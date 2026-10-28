import { MoveShapesCommand } from '../../commands/MoveShapesCommand';
import { NumberValue } from '../../util/NumberValue';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class MoveCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 3, 'move <id> <dx> <dy>');
    const document = session.document;
    const shape = document.requireShape(args[0]!.value);
    const dx = NumberValue.parse(args[1]!.value);
    const dy = NumberValue.parse(args[2]!.value);
    return session.history.execute(new MoveShapesCommand(shape, dx, dy));
  }
}
