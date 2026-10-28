export interface EditCommand {
  execute(): string;

  undo(): string;
}
