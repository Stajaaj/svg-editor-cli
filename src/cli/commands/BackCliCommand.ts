import { ReorderCommand } from '../../commands/ReorderCommand';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class BackCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 1, 'back <id>');
    const document = session.document;
    const shape = document.requireShape(args[0]!.value);
    return session.history.execute(new ReorderCommand(shape, 'back'));
  }
}
