import type { AttributeEntry } from '../../shapes/AttributeEntry';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ShowCliCommand implements CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 1, 'show <id>');
    const document = session.document;
    const shape = document.requireShape(args[0]!.value);
    const parent =
      shape.parent === document.root
        ? 'svg'
        : (shape.parent?.displayName ?? 'svg');
    const lines = [`${shape.displayName}  parent=${parent}`];

    const sections = [
      shape.geometryAttributes(),
      shape.contentAttributes(),
      shape.visualAttributes(),
    ];
    for (const section of sections) {
      if (section.length > 0) {
        lines.push(`  ${this.format(section)}`);
      }
    }
    return lines.join('\n');
  }

  private format(entries: readonly AttributeEntry[]): string {
    return entries.map((entry) => `${entry.name}=${entry.value}`).join(' ');
  }
}
