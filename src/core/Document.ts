import { EditorError } from '../errors/EditorError';
import { Container } from '../shapes/Container';
import { RootContainer } from '../shapes/RootContainer';
import type { Shape } from '../shapes/Shape';

export class Document {
  readonly root: RootContainer;
  private readonly shapesById = new Map<string, Shape>();

  constructor(width = 800, height = 600) {
    this.root = new RootContainer(width, height);
  }

  get width(): number {
    return this.root.width;
  }

  get height(): number {
    return this.root.height;
  }

  get elementCount(): number {
    return this.shapesById.size;
  }

  resize(width: number, height: number): void {
    this.root.resize(width, height);
  }

  hasId(id: string): boolean {
    return this.shapesById.has(id);
  }

  find(id: string): Shape | undefined {
    return this.shapesById.get(id);
  }

  requireShape(id: string): Shape {
    const shape = this.find(id);
    if (!shape) {
      throw new EditorError(`no such shape: ${id}`);
    }
    return shape;
  }

  requireContainer(id: string): Container {
    const shape = this.find(id);
    if (!shape) {
      throw new EditorError(`no such container: ${id}`);
    }
    if (!(shape instanceof Container)) {
      throw new EditorError(`not a container: ${id}`);
    }
    return shape;
  }

  register(shape: Shape): void {
    if (this.shapesById.has(shape.id)) {
      throw new EditorError(`id already exists: ${shape.id}`);
    }
    this.shapesById.set(shape.id, shape);
  }

  unregister(shape: Shape): void {
    this.shapesById.delete(shape.id);
  }

  registerSubtree(shape: Shape): void {
    this.register(shape);
    if (shape instanceof Container) {
      for (const child of shape.children) {
        this.registerSubtree(child);
      }
    }
  }

  unregisterSubtree(shape: Shape): void {
    this.unregister(shape);
    if (shape instanceof Container) {
      for (const child of shape.children) {
        this.unregisterSubtree(child);
      }
    }
  }

  insertSubtree(shape: Shape, parent: Container, index: number): void {
    parent.insert(shape, index);
    this.registerSubtree(shape);
  }

  removeSubtree(shape: Shape): { parent: Container; index: number } {
    const parent = shape.parent;
    if (!parent) {
      throw new EditorError(`shape is not attached: ${shape.id}`);
    }
    const index = parent.indexOf(shape);
    parent.remove(shape);
    this.unregisterSubtree(shape);
    return { parent, index };
  }

  sortByDocumentOrder(shapes: readonly Shape[]): Shape[] {
    const selected = new Set(shapes);
    const ordered: Shape[] = [];
    const visit = (shape: Shape): void => {
      if (selected.has(shape)) {
        ordered.push(shape);
      }
      if (shape instanceof Container) {
        for (const child of shape.children) {
          visit(child);
        }
      }
    };
    for (const child of this.root.children) {
      visit(child);
    }
    return ordered;
  }
}
