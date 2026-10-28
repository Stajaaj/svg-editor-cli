import { EditorError } from '../errors/EditorError';
import { SvgReader } from '../io/SvgReader';
import { SvgWriter } from '../io/SvgWriter';
import { ShapeFactory } from '../shapes/ShapeFactory';
import { CommandLineParser } from './CommandLineParser';
import { CommandRegistry } from './CommandRegistry';
import { AddToCliCommand } from './commands/AddToCliCommand';
import { BackCliCommand } from './commands/BackCliCommand';
import { CanvasCliCommand } from './commands/CanvasCliCommand';
import { CreateCliCommand } from './commands/CreateCliCommand';
import { DeleteCliCommand } from './commands/DeleteCliCommand';
import { FrontCliCommand } from './commands/FrontCliCommand';
import { GroupCliCommand } from './commands/GroupCliCommand';
import { HelpCliCommand } from './commands/HelpCliCommand';
import { InitCliCommand } from './commands/InitCliCommand';
import { MoveCliCommand } from './commands/MoveCliCommand';
import { ReadCliCommand } from './commands/ReadCliCommand';
import { RedoCliCommand } from './commands/RedoCliCommand';
import { SaveCliCommand } from './commands/SaveCliCommand';
import { ScaleCliCommand } from './commands/ScaleCliCommand';
import { SetCliCommand } from './commands/SetCliCommand';
import { ShowCliCommand } from './commands/ShowCliCommand';
import { TreeCliCommand } from './commands/TreeCliCommand';
import { UndoCliCommand } from './commands/UndoCliCommand';
import { UngroupCliCommand } from './commands/UngroupCliCommand';
import { EditorSession } from './EditorSession';

export class EditorApplication {
  private readonly session = new EditorSession();
  private readonly parser = new CommandLineParser();
  private readonly registry: CommandRegistry;

  constructor() {
    const factory = new ShapeFactory();
    const reader = new SvgReader(factory);
    const writer = new SvgWriter();
    const registry = new CommandRegistry();
    this.registry = registry;

    registry.register(
      'init',
      new InitCliCommand(),
      'init [w] [h]',
      'create a new canvas (default 800x600)',
      'document',
    );
    registry.register(
      'read',
      new ReadCliCommand(reader),
      'read <file.svg>',
      'read an SVG file as the current document',
      'document',
    );
    registry.register(
      'save',
      new SaveCliCommand(writer),
      'save [file.svg]',
      'save the current document',
      'document',
    );
    registry.register(
      'canvas',
      new CanvasCliCommand(),
      'canvas [w] [h]',
      'show or resize the canvas',
      'document',
    );
    registry.register(
      'create',
      new CreateCliCommand(factory),
      'create <type> <id> ...',
      'create rect|circle|ellipse|line|text|g',
      'edit',
    );
    registry.register(
      'delete',
      new DeleteCliCommand(),
      'delete <id>',
      'delete a shape and its descendants',
      'edit',
    );
    registry.register(
      'move',
      new MoveCliCommand(),
      'move <id> <dx> <dy>',
      'translate a shape by a delta',
      'edit',
    );
    registry.register(
      'scale',
      new ScaleCliCommand(),
      'scale <id> <factor>',
      'scale a shape geometry by a factor',
      'edit',
    );
    registry.register(
      'set',
      new SetCliCommand(),
      'set <id> <attr> <value>',
      'set an attribute on a shape',
      'edit',
    );
    registry.register(
      'group',
      new GroupCliCommand(),
      'group <newGid> <id>...',
      'group shapes into a new container',
      'edit',
    );
    registry.register(
      'ungroup',
      new UngroupCliCommand(),
      'ungroup <gid>',
      'dissolve a container into its parent',
      'edit',
    );
    registry.register(
      'addto',
      new AddToCliCommand(),
      'addto <gid> <id>',
      'move an existing shape into a container',
      'edit',
    );
    registry.register(
      'front',
      new FrontCliCommand(),
      'front <id>',
      'move a shape to the front of its siblings',
      'edit',
    );
    registry.register(
      'back',
      new BackCliCommand(),
      'back <id>',
      'move a shape to the back of its siblings',
      'edit',
    );
    registry.register(
      'tree',
      new TreeCliCommand(),
      'tree [id]',
      'show the document or subtree structure',
      'view',
    );
    registry.register(
      'show',
      new ShowCliCommand(),
      'show <id>',
      'show the attributes of a shape',
      'view',
    );
    registry.register(
      'help',
      new HelpCliCommand(registry),
      'help',
      'show all commands and syntax',
      'view',
    );
    registry.register(
      'undo',
      new UndoCliCommand(),
      'undo',
      'undo the last edit command',
      'history',
    );
    registry.register(
      'redo',
      new RedoCliCommand(),
      'redo',
      'redo the last undone edit command',
      'history',
    );
  }

  processLine(line: string): string[] {
    try {
      const tokens = this.parser.parse(line);
      if (!tokens) {
        return [];
      }
      const name = tokens[0]!.value;
      const command = this.registry.find(name);
      if (!command) {
        throw new EditorError(`unknown command: ${name}`);
      }
      const output = command.execute(this.session, tokens.slice(1));
      return output === '' ? [] : output.split('\n');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message}`];
    }
  }
}
