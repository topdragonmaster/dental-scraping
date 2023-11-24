import { dump } from '@src/support/utils';
import type { Command as Commander } from 'commander';
import { CommandRunner } from 'nest-commander';

export abstract class Runner<T> extends CommandRunner {
  protected abstract doRun(options: T): Promise<void>;

  public override setCommand(commander: Commander): this {
    super.setCommand(commander.allowExcessArguments(false));
    return this;
  }

  public override async run(passedParams: string[], options: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return await this.doRun(options as T);
    } catch (thrown: unknown) {
      this.command.error(dump(thrown), { exitCode: 1 });
    }
  }
}
