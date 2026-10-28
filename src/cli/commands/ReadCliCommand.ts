import type { SvgReader } from '../../io/SvgReader';
import { Plural } from '../../util/Plural';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ReadCliCommand implements CliCommand {
  constructor(private readonly reader: SvgReader) {}

  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectCount(args, 1, 'read <file.svg>');
    const path = args[0]!.value;
    const result = this.reader.readFile(path);
    session.open(result.document, path);
    return [
      ...result.warnings,
      `read ${path} (${Plural.elements(result.document.elementCount)})`,
    ].join('\n');
  }
}
