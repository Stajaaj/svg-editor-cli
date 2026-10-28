import type { Document } from '../core/Document';
import type { EditCommand } from '../core/EditCommand';
import type { Container } from '../shapes/Container';
import type { Shape } from '../shapes/Shape';

export class CreateShapeCommand implements EditCommand {
  private readonly index: number;

  constructor(
    private readonly document: Document,
    private readonly shape: Shape,
    private readonly parent: Container,
    private readonly explicitParent: boolean,
  ) {
    this.index = parent.childCount;
  }

  execute(): string {
    this.document.insertSubtree(this.shape, this.parent, this.index);
    return `${this.shape.displayName} created${this.parentSuffix()}`;
  }

  undo(): string {
    this.document.removeSubtree(this.shape);
    return `${this.shape.displayName} creation undone`;
  }

  private parentSuffix(): string {
    return this.explicitParent ? ` in ${this.parent.displayName}` : '';
  }
}
