import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import { TreeFormatter } from '../display/TreeFormatter';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class TreeCliCommand implements CliCommand {
  private readonly formatter = new TreeFormatter();

  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectRange(args, 0, 1, 'tree [id]');
    const document = session.document;
    if (args.length === 0) {
      return this.formatter.formatDocument(document);
    }
    const shape = document.requireShape(args[0]!.value);
    return this.formatter.formatSubtree(shape);
  }
}
