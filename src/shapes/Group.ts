import { Container } from './Container';

export class Group extends Container {
  get typeName(): string {
    return 'g';
  }

  get canUngroup(): boolean {
    return true;
  }

  treeSummary(): string {
    return this.visualTreeSummary();
  }

  toSvg(indent: number): string {
    const padding = this.indentOf(indent);
    const open = `${padding}<g${this.svgIdAttribute()}${this.svgVisualAttributes()}`;
    if (this.childCount === 0) {
      return `${open}/>`;
    }
    const inner = this.children.map((child) => child.toSvg(indent + 1)).join('\n');
    return `${open}>\n${inner}\n${padding}</g>`;
  }
}
