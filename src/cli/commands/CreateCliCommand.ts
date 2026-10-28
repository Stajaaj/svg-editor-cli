import { CreateShapeCommand } from '../../commands/CreateShapeCommand';
import { EditorError } from '../../errors/EditorError';
import type { Container } from '../../shapes/Container';
import type { ShapeFactory } from '../../shapes/ShapeFactory';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

const MINIMUM_PARAMS: Record<string, number> = {
  rect: 4,
  circle: 3,
  ellipse: 4,
  line: 4,
  text: 3,
  g: 0,
};

export class CreateCliCommand implements CliCommand {
  constructor(private readonly factory: ShapeFactory) {}

  execute(session: EditorSession, args: readonly Token[]): string {
    const document = session.document;
    if (args.length < 2) {
      throw new EditorError(
        'usage: create <type> <id> [params...] [in <containerId>]',
      );
    }

    const type = args[0]!.value;
    const id = args[1]!.value;
    if (!this.factory.isKnownType(type)) {
      throw new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
    if (id === '') {
      throw new EditorError('invalid id: (empty)');
    }
    if (document.hasId(id)) {
      throw new EditorError(`id already exists: ${id}`);
    }

    let container: Container | null = null;
    let paramsEnd = args.length;
    const firstPossibleIn = 2 + MINIMUM_PARAMS[type]!;
    for (let index = firstPossibleIn; index < args.length; index += 1) {
      const token = args[index]!;
      if (!token.quoted && token.value === 'in') {
        if (index !== args.length - 2) {
          throw new EditorError(
            'usage: create <type> <id> [params...] [in <containerId>]',
          );
        }
        container = document.requireContainer(args[index + 1]!.value);
        paramsEnd = index;
        break;
      }
    }

    const params = CommandArguments.values(args.slice(2, paramsEnd));
    const shape = this.factory.createFromCommand(type, id, params);
    const parent = container ?? document.root;
    const command = new CreateShapeCommand(
      document,
      shape,
      parent,
      container !== null,
    );
    return session.history.execute(command);
  }
}
