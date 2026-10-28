import { DeleteShapeCommand } from '../../commands/DeleteShapeCommand';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class DeleteCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 1, 'delete <id>');
    const document = session.document;
    const shape = document.requireShape(args[0]!.value);
    return session.history.execute(new DeleteShapeCommand(document, shape));
  }
}
