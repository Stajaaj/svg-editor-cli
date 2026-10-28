import { Shape } from './Shape';
import type { AttributeEntry } from './AttributeEntry';
import type { ShapeState } from './ShapeState';

export abstract class Container extends Shape {
  private readonly _children: Shape[] = [];

  get children(): readonly Shape[] {
    return this._children;
  }

  get childCount(): number {
    return this._children.length;
  }

  insert(child: Shape, index = this._children.length): void {
    const target = Math.max(0, Math.min(index, this._children.length));
    child.parent = this;
    this._children.splice(target, 0, child);
  }

  remove(child: Shape): number {
    const index = this._children.indexOf(child);
    if (index >= 0) {
      this._children.splice(index, 1);
      child.parent = null;
    }
    return index;
  }

  indexOf(child: Shape): number {
    return this._children.indexOf(child);
  }

  geometryAttributes(): AttributeEntry[] {
    return [];
  }

  override translate(dx: number, dy: number): void {
    for (const child of this._children) {
      child.translate(dx, dy);
    }
  }

  override scale(factor: number): void {
    for (const child of this._children) {
      child.scale(factor);
    }
  }

  override captureState(): ShapeState {
    const childStates = this._children.map((child) => child.captureState());
    const restoreVisual = this.captureVisualState();
    return {
      restore: () => {
        restoreVisual();
        for (const state of childStates) {
          state.restore();
        }
      },
    };
  }
}
