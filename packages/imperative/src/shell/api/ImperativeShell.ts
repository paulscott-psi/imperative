import * as readline from "readline";
import { CommandProcessor, CommandResponse, ICommandArguments, ICommandDefinition } from "../../../../cmd";
import { Parser } from "../../../../cmd/src/parser/Parser";
import { ImperativeConfig } from "../../ImperativeConfig";
import { ImperativeProfileManagerFactory } from "../../profiles/ImperativeProfileManagerFactory";
import { EnvironmentalVariableSettings, Imperative } from "../../..";
import { Constants } from "../../../../constants";
import { ImperativeHelpGeneratorFactory } from "../../help/ImperativeHelpGeneratorFactory";
import { Logger } from "../../../../logger";

/**
 * Shell for Imperative based CLIs
 * Imperative must already be initialized through init() in order to use this shell
 */
export class ImperativeShell {

    /**
     * Create a new imperative shell
     * @param commandTree - full command tree of your CLI
     * @param primaryCommands - the primary commands for the CLI. What appears in the "bin" field of your package.json
     */
    constructor(
        private commandTree: ICommandDefinition,
        private primaryCommands: string[]
    ) {
        // do nothing
    }

    public start(): Promise<void> {
        this.log.debug("Starting imperative shell for CLI with primary commands %s", this.primaryCommands);
        return new Promise<void>((resolve, reject) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                completer: this.completeCommand,
                prompt: Imperative.rootCommandName + ">"
            } as any);

            rl.on("error", (err: Error) => {
                this.log.error("Error encountered in shell. Error: " + JSON.stringify(err, null, 2));
                rl.close();
                reject(err);
            });
            rl.prompt();

            rl.on("line", (cmd: string) => {
                this.log.trace("Command of length %d received by shell", cmd.length);
                this.log.trace("Command received: %s", cmd);
                rl.pause();

                const exitCheck = cmd.trim().toLowerCase();
                if (exitCheck === "exit" || exitCheck === "quit" || exitCheck === "bye") {
                    process.stdout.write("Exit acknowledged.\n");
                    resolve();
                } else if (exitCheck === "clear" || exitCheck === "cls") {
                    process.stdout.write("\u001B[2J\u001B[0;0f"); // this insane sequence clears the screen
                    rl.prompt();
                } else {
                    const parsedArgs = Parser.parse(cmd, {
                        fullDefinitionTree: this.commandTree,
                        primaryCommands: this.primaryCommands
                    });
                    this.issueCommand(this.commandTree, parsedArgs.commandToInvoke, parsedArgs.arguments, cmd).then(() => {
                        rl.prompt();
                    }).catch((err: Error) => {
                        reject(err);
                    });

                }

            });

            rl.on("end", () => {
                process.stdout.write("End of input\n");
                rl.close();
                resolve();
            });
        });
    }

    /**
     * Given user input, determine the auto complete text to suggest to the user
     * @param command - the command entered so far
     * @returns [[potential completions], the original command line]
     */
    public completeCommand(command: string): any {
        return [["hellohello"], command];
    }

    /**
     * Issue a command that has been parsed
     * @param fullDefinition
     * @param command
     * @param args
     * @param commandIssued
     */
    private async issueCommand(fullDefinition: ICommandDefinition, command: ICommandDefinition, args: ICommandArguments, commandIssued: string) {
        const processor = new CommandProcessor({
            definition: command,
            fullDefinition,
            helpGenerator: new ImperativeHelpGeneratorFactory(Imperative.rootCommandName, ImperativeConfig.instance.loadedConfig).getHelpGenerator({
                commandDefinition: command,
                fullCommandTree: fullDefinition,
                experimentalCommandsDescription: ImperativeConfig.instance.loadedConfig.experimentalCommandDescription,
            }),
            profileManagerFactory: new ImperativeProfileManagerFactory(Imperative.api),
            rootCommandName: Imperative.rootCommandName,
            commandLine: commandIssued,
            envVariablePrefix: Imperative.envVariablePrefix,
            promptPhrase: EnvironmentalVariableSettings.read(Imperative.envVariablePrefix).promptPhrase.value ||
                Constants.DEFAULT_PROMPT_PHRASE // allow environmental variable to override the default prompt phrase
        });
        if (args[Constants.HELP_OPTION] || command.type === "group") {
            await processor.help(new CommandResponse({
                silent: false,
                responseFormat: (args[Constants.JSON_OPTION] || false) ? "json" : "default",
            }));
        } else {
            await processor.invoke({
                arguments: args,
                silent: false,
                responseFormat: (args[Constants.JSON_OPTION]) ? "json" : "default"
            });
        }
    }

    /**
     * Getter for the logger instance
     */
    private get log(): Logger {
        return Logger.getImperativeLogger();
    }
}
