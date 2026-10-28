import type { EditCommand } from '../core/EditCommand';
import type { Point } from '../shapes/Point';
import type { Shape } from '../shapes/Shape';
import type { ShapeState } from '../shapes/ShapeState';
import { NumberValue } from '../util/NumberValue';

export class MoveShapesCommand implements EditCommand {
  private state: ShapeState | null = null;
  private beforeAnchor: Point | null = null;
  private afterAnchor: Point | null = null;

  constructor(
    private readonly shape: Shape,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): string {
    this.state = this.shape.captureState();
    this.beforeAnchor = this.shape.anchor;
    this.shape.translate(this.dx, this.dy);
    this.afterAnchor = this.shape.anchor;
    if (this.afterAnchor) {
      return `${this.shape.displayName} moved to ${this.afterAnchor.format()}`;
    }
    return (
      `${this.shape.displayName} moved by ` +
      `(${NumberValue.format(this.dx)},${NumberValue.format(this.dy)})`
    );
  }

  undo(): string {
    if (!this.state) {
      throw new Error('move command has not been executed');
    }
    this.state.restore();
    if (this.beforeAnchor) {
      return `${this.shape.displayName} moved back to ${this.beforeAnchor.format()}`;
    }
    return (
      `${this.shape.displayName} moved back by ` +
      `(${NumberValue.format(-this.dx)},${NumberValue.format(-this.dy)})`
    );
  }
}
