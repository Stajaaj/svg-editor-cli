import { readFileSync } from 'node:fs';
import { DOMParser, type Element } from '@xmldom/xmldom';
import { Document } from '../core/Document';
import { EditorError } from '../errors/EditorError';
import { Container } from '../shapes/Container';
import type { Shape } from '../shapes/Shape';
import type { ShapeFactory } from '../shapes/ShapeFactory';
import { NumberValue } from '../util/NumberValue';
import type { ReadResult } from './ReadResult';

const SILENT_SKIP_ELEMENTS = new Set(['title', 'desc', 'metadata', 'defs', 'style']);

export class SvgReader {
  constructor(private readonly factory: ShapeFactory) {}

  readFile(path: string): ReadResult {
    let content: string;
    try {
      content = readFileSync(path, 'utf8');
    } catch {
      throw new EditorError(`cannot read file: ${path}`);
    }
    return this.parse(content, path);
  }

  parse(content: string, path: string): ReadResult {
    const normalized =
      content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
    let root: Element;
    try {
      const errors: string[] = [];
      const parser = new DOMParser({
        onError: (level, message) => {
          if (level !== 'warning') {
            errors.push(message);
          }
        },
      });
      const dom = parser.parseFromString(normalized, 'image/svg+xml');
      if (errors.length > 0 || !dom.documentElement) {
        throw new Error('invalid XML');
      }
      root = dom.documentElement;
      if (this.nameOf(root) !== 'svg') {
        throw new Error('root element is not <svg>');
      }
    } catch {
      throw new EditorError(`cannot parse file: ${path}`);
    }

    const warnings: string[] = [];
    const explicitIds = new Set<string>();
    this.collectExplicitIds(root, explicitIds);
    const usedIds = new Set<string>(explicitIds);
    const counters = new Map<string, number>();
    const children: Shape[] = [];

    for (const element of this.elementChildren(root)) {
      const shape = this.buildElement(element, usedIds, counters, warnings);
      if (shape) {
        children.push(shape);
      }
    }

    const document = new Document(
      this.dimension(root, 'width', this.viewBoxSize(root)?.width ?? 800),
      this.dimension(root, 'height', this.viewBoxSize(root)?.height ?? 600),
    );
    for (const child of children) {
      document.root.insert(child);
      document.registerSubtree(child);
    }
    return { document, warnings };
  }

  private collectExplicitIds(element: Element, ids: Set<string>): void {
    for (const child of this.elementChildren(element)) {
      const type = this.nameOf(child);
      if (!this.factory.isKnownType(type)) {
        continue;
      }
      const id = child.getAttribute('id');
      if (id !== null && id !== '') {
        if (ids.has(id)) {
          throw new EditorError(`duplicate id in file: ${id}`);
        }
        ids.add(id);
      }
      if (this.factory.isContainerType(type)) {
        this.collectExplicitIds(child, ids);
      }
    }
  }

  private buildElement(
    element: Element,
    usedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): Shape | null {
    const type = this.nameOf(element);
    if (!this.factory.isKnownType(type)) {
      if (!SILENT_SKIP_ELEMENTS.has(type)) {
        warnings.push(`warning: skipped unsupported element: <${type}>`);
      }
      return null;
    }

    let id = element.getAttribute('id');
    if (id === null || id === '') {
      id = this.assignId(type, usedIds, counters);
      warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    }

    const attributes: Record<string, string> = {};
    const attributeNodes = element.attributes;
    for (let index = 0; index < attributeNodes.length; index += 1) {
      const attribute = attributeNodes.item(index);
      if (attribute) {
        attributes[attribute.name] = attribute.value;
      }
    }

    const shape = this.factory.createFromAttributes(
      type,
      id,
      attributes,
      element.textContent ?? '',
    );
    if (shape instanceof Container) {
      for (const child of this.elementChildren(element)) {
        const nested = this.buildElement(child, usedIds, counters, warnings);
        if (nested) {
          shape.insert(nested);
        }
      }
    }
    return shape;
  }

  private assignId(
    type: string,
    usedIds: Set<string>,
    counters: Map<string, number>,
  ): string {
    let counter = counters.get(type) ?? 1;
    let candidate = `${type}${counter}`;
    while (usedIds.has(candidate)) {
      counter += 1;
      candidate = `${type}${counter}`;
    }
    counters.set(type, counter + 1);
    usedIds.add(candidate);
    return candidate;
  }

  private dimension(element: Element, name: string, fallback: number): number {
    const raw = element.getAttribute(name);
    if (raw === null || raw.trim() === '') {
      return fallback;
    }
    return NumberValue.parse(raw);
  }

  private viewBoxSize(
    element: Element,
  ): { width: number; height: number } | null {
    const raw = element.getAttribute('viewBox');
    if (!raw) {
      return null;
    }
    const parts = raw.trim().split(/[\s,]+/).map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
      return null;
    }
    return { width: parts[2]!, height: parts[3]! };
  }

  private elementChildren(element: Element): Element[] {
    const children: Element[] = [];
    for (let index = 0; index < element.childNodes.length; index += 1) {
      const node = element.childNodes.item(index);
      if (node && node.nodeType === 1) {
        children.push(node as Element);
      }
    }
    return children;
  }

  private nameOf(element: Element): string {
    return element.localName || element.tagName;
  }
}
