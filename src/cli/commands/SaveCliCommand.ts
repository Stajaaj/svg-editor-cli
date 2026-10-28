import { EditorError } from '../../errors/EditorError';
import type { SvgWriter } from '../../io/SvgWriter';
import { Plural } from '../../util/Plural';
import { CommandArguments } from '../CommandArguments';
import type { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class SaveCliCommand implements CliCommand {
  constructor(private readonly writer: SvgWriter) {}

  execute(session: EditorSession, args: readonly Token[]): string {
    CommandArguments.expectRange(args, 0, 1, 'save [file.svg]');
    const document = session.document;
    const path = args[0]?.value ?? session.path;
    if (!path) {
      throw new EditorError("no file path; use 'save <file.svg>'");
    }

    this.writer.saveFile(path, document);
    session.updatePath(path);
    session.history.markIoCommand();
    return `saved to ${path} (${Plural.elements(document.elementCount)})`;
  }
}
