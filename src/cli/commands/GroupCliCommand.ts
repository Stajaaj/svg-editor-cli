import { GroupShapesCommand } from '../../commands/GroupShapesCommand';
import { EditorError } from '../../errors/EditorError';
import type { Shape } from '../../shapes/Shape';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

const USAGE = 'group <newGid> <id1> <id2>...';

export class GroupCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    if (args.length < 2) {
      throw new EditorError(`usage: ${USAGE}`);
    }
    const document = session.document;
    const newGroupId = args[0]!.value;
    if (newGroupId === '') {
      throw new EditorError('invalid id: (empty)');
    }
    if (document.hasId(newGroupId)) {
      throw new EditorError(`id already exists: ${newGroupId}`);
    }

    const ids = args.slice(1).map((token) => token.value);
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        throw new EditorError(`duplicate shape: ${id}`);
      }
      seen.add(id);
    }
    const shapes = ids.map((id) => document.requireShape(id));

    const selected = new Set<Shape>(shapes);
    for (const shape of shapes) {
      let ancestor = shape.parent;
      while (ancestor) {
        if (selected.has(ancestor)) {
          throw new EditorError(
            `cannot group a container into its own descendant: ${ancestor.id}`,
          );
        }
        ancestor = ancestor.parent;
      }
    }

    return session.history.execute(
      new GroupShapesCommand(document, newGroupId, shapes),
    );
  }
}
