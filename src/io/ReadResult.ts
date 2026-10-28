import type { Document } from '../core/Document';

export interface ReadResult {
  document: Document;
  warnings: string[];
}
