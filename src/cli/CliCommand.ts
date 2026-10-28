import type { EditorSession } from './EditorSession';
import type { Token } from './Token';

export interface CliCommand {
  execute(session: EditorSession, args: readonly Token[]): string;
}
