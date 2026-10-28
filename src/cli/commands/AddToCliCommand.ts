import { AddToContainerCommand } from '../../commands/AddToContainerCommand';
import { EditorError } from '../../errors/EditorError';
import type { Container } from '../../shapes/Container';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class AddToCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 2, 'addto <gid> <id>');
    const document = session.document;
    const container = document.requireContainer(args[0]!.value);
    const shape = document.requireShape(args[1]!.value);

    let ancestor: Container | null = container;
    while (ancestor) {
      if (ancestor === shape) {
        throw new EditorError(
          `cannot move a container into its own descendant: ${shape.id}`,
        );
      }
      ancestor = ancestor.parent;
    }

    return session.history.execute(
      new AddToContainerCommand(document, container, shape),
    );
  }
}
