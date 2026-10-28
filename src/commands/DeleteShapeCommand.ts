import type { Document } from '../core/Document';
import type { EditCommand } from '../core/EditCommand';
import type { Container } from '../shapes/Container';
import type { Shape } from '../shapes/Shape';

export class DeleteShapeCommand implements EditCommand {
  private parent: Container | null = null;
  private index = 0;

  constructor(
    private readonly document: Document,
    private readonly shape: Shape,
  ) {}

  execute(): string {
    const removed = this.document.removeSubtree(this.shape);
    this.parent = removed.parent;
    this.index = removed.index;
    return `${this.shape.displayName} deleted`;
  }

  undo(): string {
    if (!this.parent) {
      throw new Error('delete command has not been executed');
    }
    this.document.insertSubtree(this.shape, this.parent, this.index);
    const target =
      this.parent === this.document.root
        ? 'restored to canvas'
        : `restored into ${this.parent.displayName}`;
    return `${this.shape.displayName} ${target}`;
  }
}
