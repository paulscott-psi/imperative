import * as readline from "readline";
import {
    CommandProcessor,
    CommandResponse,
    CommandUtils,
    ICommandArguments,
    ICommandDefinition
} from "../../../../cmd";
import { Parser } from "../../../../cmd/src/parser/Parser";
import { ImperativeConfig } from "../../ImperativeConfig";
import { ImperativeProfileManagerFactory } from "../../profiles/ImperativeProfileManagerFactory";
import { EnvironmentalVariableSettings, Imperative } from "../../..";
import { Constants } from "../../../../constants";
import { ImperativeHelpGeneratorFactory } from "../../help/ImperativeHelpGeneratorFactory";
import { Logger } from "../../../../logger";
import { TextUtils } from "../../../../utilities";

/**
 * Shell for Imperative based CLIs
 * Imperative must already be initialized through init() in order to use this shell
 */
export class ImperativeShell {

    /**
     * Create a new imperative shell
     * @param commandTree - full command tree of your CLI
     * @param primaryCommands - the primary commands for the CLI. What appears in the "bin" field of your package.json
     * @param mainBinName - the primary command that you would like to display in error messages/help
     */
    constructor(
        private commandTree: ICommandDefinition,
        private primaryCommands: string[],
        private mainBinName: string
    ) {
        // do nothing
    }

    public start(): Promise<void> {
        this.log.debug("Starting imperative shell for CLI with primary commands %s", this.primaryCommands);
        return new Promise<void>((resolve, reject) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                completer: this.completeCommand.bind(this),
                prompt: TextUtils.chalk.yellow(Imperative.rootCommandName + ">")
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
                    if (parsedArgs.success) {
                        this.issueCommand(this.commandTree, parsedArgs.commandToInvoke, parsedArgs.arguments, cmd).then(() => {
                            rl.prompt();
                        }).catch((err: Error) => {
                            reject(err);
                        });
                    } else {
                        this.failCommand(this.commandTree, parsedArgs.arguments, cmd).then(() => {
                            rl.prompt();
                        }).catch((err: Error) => {
                            rl.prompt(); // syntax errors are okay, don't stop the shell.
                        });
                    }

                }

            });

            rl.on("end", () => {
                process.stdout.write("End of input\n");
                rl.close();
                resolve();
            });

            process.stdin.on("end", () => {
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
        const lev = require("levenshtein");
        let minimumLevDistance: number = 999999;
        let closestCommand: string;

        const commandTree = CommandUtils.flattenCommandTreeWithAliases(this.commandTree).filter((command) => {
            return command.command.type === "command";
        });
        let secondClosestCommand: string;
        for (const commandInTree of commandTree) {
            if (commandInTree.fullName.trim().length === 0) {
                continue;
            }
            const compare = new lev(command, commandInTree.fullName);
            if (compare.distance < minimumLevDistance) {
                minimumLevDistance = compare.distance;

                secondClosestCommand = closestCommand;
                closestCommand = commandInTree.fullName;
            }
        }
        return [[closestCommand, secondClosestCommand], command];
    }

    private async failCommand(fullDefinition: ICommandDefinition, args: ICommandArguments, commandIssued: string) {
        const failedCommandHandler = __dirname + "/../../../../cmd/src/handlers/FailedCommandHandler";
        const failedCommandDefinition: ICommandDefinition = {
            name: this.mainBinName + " " + commandIssued,
            handler: failedCommandHandler,
            type: "command",
            description: "The command you tried to invoke failed"
        };
        // unknown command, not successful
        const lev = require("levenshtein");
        let minimumLevDistance: number = 999999;
        let closestCommand: string;
        const commandTree = CommandUtils.flattenCommandTreeWithAliases(this.commandTree);

        for (const command of commandTree) {
            if (command.fullName.trim().length === 0) {
                continue;
            }
            const compare = new lev(commandIssued, command.fullName);
            if (compare.distance < minimumLevDistance) {
                minimumLevDistance = compare.distance;
                closestCommand = command.fullName;
            }
        }
        args.failureMessage = this.buildFailureMessage(commandIssued, closestCommand);
        return this.issueCommand(fullDefinition, failedCommandDefinition, args, commandIssued);
    }

    private buildFailureMessage(commandIssued: string, closestCommand ?: string) {

        const three: number = 3;
        let commands: string = "";
        let groups: string = " "; // default to " " for proper spacing in message
        let delimiter: string = ""; // used to delimit between possible 'command' values

        let failureMessage = "Command failed due to improper syntax";
        failureMessage += `\nCommand entered: "${this.mainBinName} ${commandIssued}"`;
        // limit to three to include two levels of group and command value, if present
        const groupValues = commandIssued.split(" ", three);

        let firstUnknownGroup = groupValues[0];
        // loop through the top level groups
        for (const group of this.commandTree.children) {
            if ((group.name.trim() === groupValues[0]) || (group.aliases[0] === groupValues[0])) {
                groups += groupValues[0] + " ";
                // found the top level group so loop to see if second level group valid
                firstUnknownGroup = groupValues[1];
                for (const group2 of group.children) {
                    if ((group2.name.trim() === groupValues[1]) || (group2.aliases[0] === groupValues[1])) {
                        groups += groupValues[1] + " ";
                        // second level group valid so command provided is invalid, retrieve the valid command(s)
                        for (let i = 0; i < group2.children.length; i++) {
                            if (i > 0) {
                                delimiter = ", ";
                            }
                            commands += delimiter + group2.children[i].name;
                        }
                        break;
                    }
                }
                break;
            }
        }

        if (closestCommand != null) {
            failureMessage += TextUtils.formatMessage("\nUnknown group: %s\n", firstUnknownGroup);
            failureMessage += TextUtils.formatMessage("Did you mean: %s?", closestCommand);
        }

        if (commands.length > 0) {
            failureMessage += `\nAvailable commands are "${commands}".`;
        }
        failureMessage += `\nUse "${this.mainBinName}${groups}--help" to view groups, commands, and options.`;
        return failureMessage;
    }


    /**
     * Issue a command that has been parsed
     * @param fullDefinition
     * @param command
     * @param args
     * @param commandIssued
     */
    private async issueCommand(fullDefinition: ICommandDefinition,
                               command: ICommandDefinition, args: ICommandArguments,
                               commandIssued: string) {
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
        if (args[Constants.HELP_OPTION] || (command.type === "group" && command !== this.commandTree)) {
            // don't just invoke help for root command since there are options like --version on the root command
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
