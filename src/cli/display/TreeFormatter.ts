import type { Document } from '../../core/Document';
import { Container } from '../../shapes/Container';
import type { Shape } from '../../shapes/Shape';

interface TreeRow {
  prefix: string;
  label: string;
  summary: string;
}

export class TreeFormatter {
  formatDocument(document: Document): string {
    const root = document.root;
    const rows: TreeRow[] = [];
    this.collectChildren(root, '', rows);
    return [
      `${root.displayName} ${root.treeSummary()}`,
      ...this.render(rows),
    ].join('\n');
  }

  formatSubtree(shape: Shape): string {
    const rows: TreeRow[] = [
      { prefix: '', label: shape.displayName, summary: shape.treeSummary() },
    ];
    if (shape instanceof Container) {
      this.collectChildren(shape, '', rows);
    }
    return this.render(rows).join('\n');
  }

  private collectChildren(
    container: Container,
    basePrefix: string,
    rows: TreeRow[],
  ): void {
    const children = container.children;
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      const prefix = `${basePrefix}${last ? '└── ' : '├── '}`;
      rows.push({
        prefix,
        label: child.displayName,
        summary: child.treeSummary(),
      });
      if (child instanceof Container) {
        this.collectChildren(
          child,
          `${basePrefix}${last ? '    ' : '│   '}`,
          rows,
        );
      }
    });
  }

  private render(rows: readonly TreeRow[]): string[] {
    if (rows.length === 0) {
      return [];
    }
    const width = Math.max(
      ...rows.map((row) => row.prefix.length + row.label.length),
    );
    const column = width + 2;
    return rows.map((row) => {
      const labelPart = `${row.prefix}${row.label}`;
      if (row.summary === '') {
        return labelPart;
      }
      return `${labelPart}${' '.repeat(column - labelPart.length)}${row.summary}`;
    });
  }
}
