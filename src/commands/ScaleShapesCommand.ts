import type { EditCommand } from '../core/EditCommand';
import type { Shape } from '../shapes/Shape';
import type { ShapeState } from '../shapes/ShapeState';
import { NumberValue } from '../util/NumberValue';

export class ScaleShapesCommand implements EditCommand {
  private state: ShapeState | null = null;

  constructor(
    private readonly shape: Shape,
    private readonly factor: number,
  ) {}

  execute(): string {
    this.state = this.shape.captureState();
    this.shape.scale(this.factor);
    return `${this.shape.displayName} scaled by ${NumberValue.format(this.factor)}`;
  }

  undo(): string {
    if (!this.state) {
      throw new Error('scale command has not been executed');
    }
    this.state.restore();
    return `${this.shape.displayName} scaled back`;
  }
}
