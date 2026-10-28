import { UngroupCommand } from '../../commands/UngroupCommand';
import { EditorError } from '../../errors/EditorError';
import { Group } from '../../shapes/Group';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class UngroupCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 1, 'ungroup <gid>');
    const document = session.document;
    const id = args[0]!.value;
    const shape = document.requireShape(id);
    if (!(shape instanceof Group)) {
      throw new EditorError(`not a container: ${id}`);
    }
    if (!shape.canUngroup) {
      throw new EditorError(`cannot ungroup composite shape: ${id}`);
    }
    if (shape.parent === document.root) {
      throw new EditorError(`cannot ungroup top-level container: ${id}`);
    }
    return session.history.execute(new UngroupCommand(document, shape));
  }
}
