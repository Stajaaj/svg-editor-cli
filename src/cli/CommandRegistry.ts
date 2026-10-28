import type { CliCommand } from './CliCommand';

export interface RegisteredCommand {
  name: string;
  usage: string;
  description: string;
  category: string;
}

interface CommandEntry extends RegisteredCommand {
  command: CliCommand;
}

export class CommandRegistry {
  private readonly entries = new Map<string, CommandEntry>();

  // Allow-listed name dispatch #1 (command name -> implementation). Plugin commands replace this later.
  register(
    name: string,
    command: CliCommand,
    usage: string,
    description: string,
    category: string,
  ): void {
    this.entries.set(name, { name, command, usage, description, category });
  }

  find(name: string): CliCommand | undefined {
    return this.entries.get(name)?.command;
  }

  describe(): RegisteredCommand[] {
    return [...this.entries.values()].map(({ name, usage, description, category }) => ({
      name,
      usage,
      description,
      category,
    }));
  }
}
