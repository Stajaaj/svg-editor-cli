import { EditorError } from '../errors/EditorError';
import type { Token } from './Token';

export class CommandLineParser {
  parse(line: string): Token[] | null {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return null;
    }

    const tokens: Token[] = [];
    let current = '';
    let quoted = false;
    let started = false;
    let inQuotes = false;

    for (let index = 0; index < trimmed.length; index += 1) {
      const character = trimmed[index]!;
      if (inQuotes) {
        const next = trimmed[index + 1];
        if (character === '\\' && (next === '"' || next === '\\')) {
          current += next;
          index += 1;
        } else if (character === '"') {
          inQuotes = false;
        } else {
          current += character;
        }
      } else if (character === '"') {
        inQuotes = true;
        quoted = true;
        started = true;
      } else if (/\s/.test(character)) {
        if (started) {
          tokens.push({ value: current, quoted });
          current = '';
          quoted = false;
          started = false;
        }
      } else {
        current += character;
        started = true;
      }
    }

    if (inQuotes) {
      throw new EditorError('invalid syntax: unclosed quote');
    }
    if (started) {
      tokens.push({ value: current, quoted });
    }
    return tokens;
  }
}
