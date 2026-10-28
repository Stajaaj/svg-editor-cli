import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { CommandRegistry, RegisteredCommand } from '../CommandRegistry';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

const USAGE_WIDTH = 30;

export class HelpCliCommand implements CliCommand {
  constructor(private readonly registry: CommandRegistry) {}

  execute(_session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 0, 'help');

    const lines = ['commands:'];
    const grouped = new Map<string, RegisteredCommand[]>();
    for (const entry of this.registry.describe()) {
      const entries = grouped.get(entry.category) ?? [];
      entries.push(entry);
      grouped.set(entry.category, entries);
    }
    for (const [category, entries] of grouped) {
      lines.push(`  [${category}]`);
      for (const entry of entries) {
        lines.push(
          `    ${entry.usage.padEnd(USAGE_WIDTH)}  ${entry.description}`,
        );
      }
    }

    lines.push(
      '',
      'create types:',
      '  rect <id> <x> <y> <w> <h> [fill]',
      '  circle <id> <cx> <cy> <r> [fill]',
      '  ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      '  line <id> <x1> <y1> <x2> <y2> [stroke]',
      '  text <id> <x> <y> "content"',
      '  g <id>',
      '  append "in <containerId>" to create a shape inside a container',
    );
    return lines.join('\n');
  }
}
