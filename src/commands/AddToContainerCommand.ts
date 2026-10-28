import type { Document } from '../core/Document';
import type { EditCommand } from '../core/EditCommand';
import type { Container } from '../shapes/Container';
import type { Shape } from '../shapes/Shape';

export class AddToContainerCommand implements EditCommand {
  private readonly originalParent: Container;
  private readonly originalIndex: number;

  constructor(
    private readonly document: Document,
    private readonly container: Container,
    private readonly shape: Shape,
  ) {
    const parent = shape.parent;
    if (!parent) {
      throw new Error(`shape is not attached: ${shape.id}`);
    }
    this.originalParent = parent;
    this.originalIndex = parent.indexOf(shape);
  }

  execute(): string {
    this.shape.parent?.remove(this.shape);
    this.container.insert(this.shape);
    return `${this.shape.displayName} added to ${this.container.displayName}`;
  }

  undo(): string {
    this.container.remove(this.shape);
    this.originalParent.insert(this.shape, this.originalIndex);
    const target =
      this.originalParent === this.document.root
        ? 'canvas'
        : this.originalParent.displayName;
    return `${this.shape.displayName} restored to ${target}`;
  }
}
