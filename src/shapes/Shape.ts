import { EditorError } from '../errors/EditorError';
import { XmlText } from '../util/XmlText';
import type { AttributeEntry } from './AttributeEntry';
import type { Container } from './Container';
import type { Point } from './Point';
import type { ShapeState } from './ShapeState';

export abstract class Shape {
  parent: Container | null = null;
  protected fill: string | undefined;
  protected stroke: string | undefined;
  protected strokeWidth: string | undefined;

  constructor(readonly id: string) {}

  abstract get typeName(): string;

  get displayName(): string {
    return `${this.typeName}#${this.id}`;
  }

  get anchor(): Point | null {
    return null;
  }

  abstract translate(dx: number, dy: number): void;

  abstract scale(factor: number): void;

  abstract captureState(): ShapeState;

  abstract geometryAttributes(): AttributeEntry[];

  contentAttributes(): AttributeEntry[] {
    return [];
  }

  visualAttributes(): AttributeEntry[] {
    const entries: AttributeEntry[] = [];
    if (this.fill !== undefined) {
      entries.push({ name: 'fill', value: this.fill });
    }
    if (this.stroke !== undefined) {
      entries.push({ name: 'stroke', value: this.stroke });
    }
    if (this.strokeWidth !== undefined) {
      entries.push({ name: 'stroke-width', value: this.strokeWidth });
    }
    return entries;
  }

  attributeDisplay(name: string): string | undefined {
    const entries = [
      ...this.contentAttributes(),
      ...this.geometryAttributes(),
      ...this.visualAttributes(),
    ];
    return entries.find((entry) => entry.name === name)?.value;
  }

  setAttribute(name: string, value: string): void {
    if (this.setVisualAttribute(name, value)) {
      return;
    }
    throw new EditorError(`unknown attribute: ${name}`);
  }

  protected setVisualAttribute(name: string, value: string): boolean {
    if (name === 'fill') {
      this.fill = value;
      return true;
    }
    if (name === 'stroke') {
      this.stroke = value;
      return true;
    }
    if (name === 'stroke-width') {
      this.strokeWidth = value;
      return true;
    }
    return false;
  }

  protected captureVisualState(): () => void {
    const fill = this.fill;
    const stroke = this.stroke;
    const strokeWidth = this.strokeWidth;
    return () => {
      this.fill = fill;
      this.stroke = stroke;
      this.strokeWidth = strokeWidth;
    };
  }

  protected visualTreeSummary(): string {
    return this.fill !== undefined ? `fill=${this.fill}` : '';
  }

  protected withVisualSummary(summary: string): string {
    const visual = this.visualTreeSummary();
    return visual === '' ? summary : `${summary} ${visual}`;
  }

  protected svgIdAttribute(): string {
    return ` id="${XmlText.escapeAttribute(this.id)}"`;
  }

  protected svgVisualAttributes(): string {
    let attributes = '';
    if (this.fill !== undefined) {
      attributes += ` fill="${XmlText.escapeAttribute(this.fill)}"`;
    }
    if (this.stroke !== undefined) {
      attributes += ` stroke="${XmlText.escapeAttribute(this.stroke)}"`;
    }
    if (this.strokeWidth !== undefined) {
      attributes += ` stroke-width="${XmlText.escapeAttribute(this.strokeWidth)}"`;
    }
    return attributes;
  }

  protected indentOf(indent: number): string {
    return '  '.repeat(indent);
  }

  abstract treeSummary(): string;

  abstract toSvg(indent: number): string;
}
