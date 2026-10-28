import { writeFileSync } from 'node:fs';
import type { Document } from '../core/Document';
import { EditorError } from '../errors/EditorError';

export class SvgWriter {
  write(document: Document): string {
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      `${document.root.toSvg(0)}\n`
    );
  }

  saveFile(path: string, document: Document): void {
    try {
      writeFileSync(path, this.write(document), 'utf8');
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    }
  }
}
