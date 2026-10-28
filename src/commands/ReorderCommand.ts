import type { EditCommand } from '../core/EditCommand';
import type { Container } from '../shapes/Container';
import type { Shape } from '../shapes/Shape';

export class ReorderCommand implements EditCommand {
  private readonly parent: Container;
  private readonly originalIndex: number;

  constructor(
    private readonly shape: Shape,
    private readonly target: 'front' | 'back',
  ) {
    const parent = shape.parent;
    if (!parent) {
      throw new Error(`shape is not attached: ${shape.id}`);
    }
    this.parent = parent;
    this.originalIndex = parent.indexOf(shape);
  }

  execute(): string {
    this.parent.remove(this.shape);
    this.parent.insert(
      this.shape,
      this.target === 'front' ? this.parent.childCount : 0,
    );
    return `${this.shape.displayName} moved to ${this.target}`;
  }

  undo(): string {
    this.parent.remove(this.shape);
    this.parent.insert(this.shape, this.originalIndex);
    return `${this.shape.displayName} z-order restored`;
  }
}
