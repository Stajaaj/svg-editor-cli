import { SetAttributeCommand } from '../../commands/SetAttributeCommand';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class SetCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 3, 'set <id> <attr> <value>');
    const document = session.document;
    const shape = document.requireShape(args[0]!.value);
    const command = new SetAttributeCommand(shape, args[1]!.value, args[2]!.value);
    return session.history.execute(command);
  }
}
