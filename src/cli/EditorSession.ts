import type { Document } from '../core/Document';
import { History } from '../core/History';
import { EditorError } from '../errors/EditorError';

export class EditorSession {
  private currentDocument: Document | null = null;
  private currentPath: string | null = null;
  readonly history = new History();

  get document(): Document {
    if (!this.currentDocument) {
      throw new EditorError("no document. use 'init' or 'read' first");
    }
    return this.currentDocument;
  }

  get path(): string | null {
    return this.currentPath;
  }

  open(document: Document, path: string | null): void {
    this.currentDocument = document;
    this.currentPath = path;
    this.history.reset();
  }

  updatePath(path: string): void {
    this.currentPath = path;
  }
}
