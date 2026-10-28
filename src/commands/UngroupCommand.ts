import type { Document } from '../core/Document';
import type { EditCommand } from '../core/EditCommand';
import type { Container } from '../shapes/Container';
import type { Group } from '../shapes/Group';
import type { Shape } from '../shapes/Shape';
import { Plural } from '../util/Plural';

export class UngroupCommand implements EditCommand {
  private readonly parent: Container;
  private readonly index: number;
  private readonly children: readonly Shape[];

  constructor(
    private readonly document: Document,
    private readonly group: Group,
  ) {
    const parent = group.parent;
    if (!parent) {
      throw new Error(`shape is not attached: ${group.id}`);
    }
    this.parent = parent;
    this.index = parent.indexOf(group);
    this.children = [...group.children];
  }

  execute(): string {
    this.parent.remove(this.group);
    this.document.unregister(this.group);
    this.children.forEach((child, offset) => {
      this.group.remove(child);
      this.parent.insert(child, this.index + offset);
    });
    return `${this.group.displayName} ungrouped (${Plural.children(this.children.length)})`;
  }

  undo(): string {
    for (const child of this.children) {
      this.parent.remove(child);
      this.group.insert(child);
    }
    this.parent.insert(this.group, this.index);
    this.document.register(this.group);
    return (
      `${this.group.displayName} restored with ` +
      `${Plural.children(this.children.length)}`
    );
  }
}
