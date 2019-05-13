import { IParserParameters } from "../doc/parser/IParserParameters";
import { IParseResult } from "../doc/parser/IParseResult";
import { ICommandDefinition } from "../..";
import { isString } from "util";

const splitArgs = require("splitargs2");

/**
 * Parses a command based on command definitions
 */
export class Parser {
    /**
     * Parse a command
     * @param {string[]} commandStringOrArguments - the arguments that you would like to parse
     * @param params - parameters for parsing. See IParserParameters
     */
    public static parse(commandStringOrArguments: string | string[],
                        params: IParserParameters
    ): IParseResult {

        let commandArguments: string[];
        if (isString(commandStringOrArguments)) {
            this.log.trace("splitting command into arguments. Command: \"%s\"", commandStringOrArguments);
            commandArguments = splitArgs(commandStringOrArguments);
            this.log.trace("Parsed arguments: %s", commandArguments);
        }
        let currentCommand: ICommandDefinition = params.fullDefinitionTree; // start with the root command
        let primaryCommand = params.fullDefinitionTree.name;
        if (params.primaryCommands && params.primaryCommands.length > 0) {
            this.log.trace("Primary commands for this parsing job are: %s. Comparing against %s", params.primaryCommands,
                commandArguments[0]);
            if (params.primaryCommands.indexOf(commandArguments[0]) >= 0) {
                this.log.trace("Found primary command %s as first argument of arguments", commandArguments[0]);
                primaryCommand = commandArguments[0];
                commandArguments = commandArguments.slice(1); // delete the primary command from the arguments to parse
            }
        }

        // remove any empty arguments, no point in parsing them
        commandArguments = commandArguments.filter((argument) => {
            return argument.trim().length > 0;
        });
        // initialize the parsing result
        const result: IParseResult = {
            arguments: {
                _: [],
                $0: primaryCommand
            },
        };

        let argumentIndex = 0;
        let currentArgument: string;
        while (argumentIndex < commandArguments.length) {
            currentArgument = commandArguments[argumentIndex];
            this.log.trace("Parsing command argument " + currentArgument);
            if (!this.isDashOption(currentArgument)) {

                if (currentCommand.children && currentCommand.children.length > 0) {
                    this.log.trace("Current command name is %s, has %s children", currentCommand.name, currentCommand.children.length);
                    for (const child of currentCommand.children) {
                        let commandFound = false;
                        if (child.name === currentArgument) {
                            this.log.trace("Found command name " + child.name);
                            result.arguments._.push(currentArgument);
                            currentCommand = child;
                            commandFound = true;
                        }
                        if (!commandFound && child.aliases && child.aliases.length > 0) {
                            for (const alias of child.aliases) {
                                if (alias === currentArgument) {
                                    this.log.trace("Found command alias " + alias);
                                    result.arguments._.push(currentArgument);
                                    currentCommand = child;
                                    commandFound = true;
                                }
                            }
                        }
                    }

                }
            } else {
                this.log.trace("%s is a dash argument", currentArgument);

            }
            argumentIndex++;
        }
        result.commandToInvoke = currentCommand;
        return result;
    }

    private static isDashOption(argument: string) {
        return argument.charAt(0) === "-";
    }

    private static get log(): any {
        return {
            trace: (...args: any[]) => {
                console.log.apply(this, args);
            }
        };
        // return Logger.getAppLogger();
    }
}
