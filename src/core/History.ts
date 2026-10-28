import { EditorError } from '../errors/EditorError';
import type { EditCommand } from './EditCommand';

export class History {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private locked = false;

  execute(command: EditCommand): string {
    const message = command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.locked = false;
    return message;
  }

  undo(): string {
    this.assertUnlocked();
    const command = this.undoStack.pop();
    if (!command) {
      throw new EditorError('nothing to undo');
    }
    const message = command.undo();
    this.redoStack.push(command);
    return message;
  }

  redo(): string {
    this.assertUnlocked();
    const command = this.redoStack.pop();
    if (!command) {
      throw new EditorError('nothing to redo');
    }
    const message = command.execute();
    this.undoStack.push(command);
    return message;
  }

  markIoCommand(): void {
    this.locked = true;
  }

  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.locked = true;
  }

  private assertUnlocked(): void {
    if (this.locked) {
      throw new EditorError('undo not allowed after io command');
    }
  }
}
