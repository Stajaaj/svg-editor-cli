import type { EditCommand } from '../core/EditCommand';
import type { Shape } from '../shapes/Shape';
import type { ShapeState } from '../shapes/ShapeState';

export class SetAttributeCommand implements EditCommand {
  private state: ShapeState | null = null;
  private oldDisplay = '';

  constructor(
    private readonly shape: Shape,
    private readonly name: string,
    private readonly value: string,
  ) {}

  execute(): string {
    this.state = this.shape.captureState();
    this.oldDisplay = this.shape.attributeDisplay(this.name) ?? '';
    this.shape.setAttribute(this.name, this.value);
    const display = this.shape.attributeDisplay(this.name) ?? this.value;
    return `${this.shape.displayName} updated: ${this.name}=${display}`;
  }

  undo(): string {
    if (!this.state) {
      throw new Error('set command has not been executed');
    }
    this.state.restore();
    return `${this.shape.displayName} updated: ${this.name}=${this.oldDisplay}`;
  }
}
