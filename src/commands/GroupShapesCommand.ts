import type { Document } from '../core/Document';
import type { EditCommand } from '../core/EditCommand';
import type { Container } from '../shapes/Container';
import { Group } from '../shapes/Group';
import type { Shape } from '../shapes/Shape';
import { Plural } from '../util/Plural';

interface Placement {
  shape: Shape;
  parent: Container;
  index: number;
}

export class GroupShapesCommand implements EditCommand {
  private readonly group: Group;
  private readonly placements: Placement[];
  private readonly parent: Container;
  private readonly insertIndex: number;
  private readonly orderedShapes: Shape[];

  constructor(
    private readonly document: Document,
    newGroupId: string,
    shapes: readonly Shape[],
  ) {
    this.group = new Group(newGroupId);
    this.placements = shapes.map((shape) => {
      const parent = shape.parent;
      if (!parent) {
        throw new Error(`shape is not attached: ${shape.id}`);
      }
      return { shape, parent, index: parent.indexOf(shape) };
    });
    if (this.placements.length === 0) {
      throw new Error('group command requires at least one shape');
    }
    this.parent = this.placements[0]!.parent;
    this.insertIndex = Math.min(
      ...this.placements
        .filter((placement) => placement.parent === this.parent)
        .map((placement) => placement.index),
    );
    this.orderedShapes = document.sortByDocumentOrder(shapes);
  }

  execute(): string {
    for (const shape of this.orderedShapes) {
      shape.parent?.remove(shape);
    }
    for (const shape of this.orderedShapes) {
      this.group.insert(shape);
    }
    this.parent.insert(this.group, this.insertIndex);
    this.document.register(this.group);
    return (
      `${this.group.displayName} created with ` +
      `${Plural.children(this.orderedShapes.length)}`
    );
  }

  undo(): string {
    this.parent.remove(this.group);
    this.document.unregister(this.group);
    for (const child of [...this.group.children]) {
      this.group.remove(child);
    }
    const placements = [...this.placements].sort((a, b) => a.index - b.index);
    for (const placement of placements) {
      placement.parent.insert(placement.shape, placement.index);
    }
    return (
      `${this.group.displayName} removed (` +
      `${Plural.children(this.orderedShapes.length)} restored)`
    );
  }
}
