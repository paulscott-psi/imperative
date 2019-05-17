import { IParserParameters } from "../doc/parser/IParserParameters";
import { IParseResult } from "../doc/parser/IParseResult";
import { ICommandArguments, ICommandDefinition, ICommandOptionDefinition } from "../..";
import { isString } from "util";
import { CliUtils } from "../../../utilities/src/CliUtils";
import { Constants } from "../../../constants";
import { IOptionFormat } from "../../../utilities/src/doc/IOptionFormat";

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

        // initialize the parsing result
        const result: IParseResult = {
            arguments: {
                _: [],
                $0: primaryCommand
            },
            success: true,
            unknownArguments: []
        };
        if (commandArguments.join("").trim().length === 0) {
            // issue the root command help if there are no args
            result.commandToInvoke = params.fullDefinitionTree;
            return result;
        }

        let argumentIndex = 0;
        let currentArgument: string;
        let positionalIndex = 0;
        while (argumentIndex < commandArguments.length) {
            currentArgument = commandArguments[argumentIndex];
            this.log.trace("Parsing command argument " + currentArgument);
            if (currentArgument.trim().length === 0) {
                this.log.trace("Skipping blank argument");
                argumentIndex++;
                continue;
            }
            if (!this.isDashOption(currentArgument)) {
                let commandFound = false;
                if (currentCommand.children && currentCommand.children.length > 0) {
                    this.log.trace("Current command name is '%s', has '%s' children", currentCommand.name, currentCommand.children.length);
                    for (const child of currentCommand.children) {
                        this.log.trace("Comparing argument '%s' against command with name '%s' and aliases '%s'",
                            currentArgument, child.name, child.aliases);
                        if (child.name.trim() === currentArgument) {
                            this.log.trace("Found command name '" + child.name + "'");
                            result.arguments._.push(currentArgument);
                            currentCommand = child;
                            commandFound = true;
                            break;
                        }
                        if (!commandFound && child.aliases && child.aliases.length > 0) {
                            for (const alias of child.aliases) {
                                if (alias.trim() === currentArgument) {
                                    this.log.trace("Found command alias '%s'", alias);
                                    result.arguments._.push(currentArgument);
                                    currentCommand = child;
                                    commandFound = true;
                                    break;
                                }
                            }
                        }
                    }

                } else if (currentCommand.positionals && positionalIndex < currentCommand.positionals.length) {
                    const positional = currentCommand.positionals[positionalIndex];
                    if (positional.name.indexOf("...") === -1) {
                        result.arguments[positional.name] = currentArgument;
                        positionalIndex++;
                        commandFound = true;

                    } else {
                        // array type positional
                        // keep going until the end or until the next dash argument
                        result.arguments[positional.name] = [];
                        while (argumentIndex < commandArguments.length) {
                            currentArgument = commandArguments[argumentIndex];
                            if (this.isDashOption(currentArgument)) {
                                // step back one, we are not processing this dash argument yet
                                argumentIndex--;
                                break;
                            }
                            result.arguments[positional.name].push(currentArgument);
                            argumentIndex++;
                        }
                        commandFound = true;
                    }
                }
                if (!commandFound && currentArgument.trim().length > 0) {
                    result.unknownArguments.push(currentArgument);
                    result.success = false;
                }
            } else {
                this.log.trace("%s is a dash argument", currentArgument);

                if (currentArgument.indexOf("=") >= 0) {
                    this.log.trace("Found equals sign (=) in argument '%s'. Attempting to split on =", currentArgument);
                    const optionNameAndValue = currentArgument.split("=");
                    if (optionNameAndValue.length > 2) {
                        this.log.trace("More than one equals sign in argument '%s'. Parsing may be incorrect", currentArgument);
                    }
                    this.log.trace("Split argument into: " + optionNameAndValue);
                    const optionName = optionNameAndValue[0].replace(/^-+/, "");
                    let optionValue: any = optionNameAndValue.slice(1).join("");
                    const option = this.findOptionInCommand(optionName, currentCommand);
                    if (option == null) {
                        this.log.trace("Couldn't find option %s in command. Unknown option", optionName);
                        result.unknownArguments.push(currentArgument);
                        result.success = false;
                    } else {
                        const optionFormat = CliUtils.getOptionFormat(option.name);
                        if (option.type === "boolean") {
                            if (optionValue.toUpperCase() === "TRUE") {
                                optionValue = true;
                            } else if (optionValue.toUpperCase() === "FALSE") {
                                optionValue = false;
                            }
                        }
                        this.setOptionValue(result.arguments, optionName, optionFormat, optionValue);
                    }
                } else {
                    this.log.trace("No equals sign in argument '%s'", currentArgument);
                    const optionName = currentArgument.replace(/^-+/, "");
                    const option = this.findOptionInCommand(optionName, currentCommand);
                    if (option == null) {
                        this.log.trace("Couldn't find option %s in command. Unknown option", optionName);
                        result.unknownArguments.push(currentArgument);
                        result.success = false;
                    } else {

                        const optionFormat = CliUtils.getOptionFormat(option.name);
                        if (option.type === "boolean") {
                            if (argumentIndex < commandArguments.length - 1) {
                                // look ahead at the next argument and see if it is true or false
                                argumentIndex++;
                                currentArgument = commandArguments[argumentIndex];
                                let optionValue = true;
                                if (currentArgument.trim().toUpperCase() === "TRUE") {
                                    optionValue = true;
                                } else if (currentArgument.trim().toUpperCase() === "FALSE") {
                                    optionValue = false;
                                } else {
                                    // not an explicit setting for a boolean argument. Go backwards
                                    argumentIndex--;
                                }
                                this.setOptionValue(result.arguments, optionName, optionFormat, optionValue);
                            } else {
                                // default to true for a boolean type argument if specified without a following value
                                this.setOptionValue(result.arguments, optionName, optionFormat, true);
                            }
                        } else if (option.type === "array") {
                            // initialize argument arrays
                            this.setOptionValue(result.arguments, optionName, optionFormat, []);

                            while (argumentIndex < commandArguments.length) {
                                currentArgument = commandArguments[argumentIndex];
                                if (this.isDashOption(currentArgument)) {
                                    // step back one, we are not processing this dash argument yet
                                    // dash arguments mark the end of an array type option
                                    argumentIndex--;
                                    break;
                                }
                                result.arguments[optionName].push(currentArgument);
                                result.arguments[optionFormat.kebabCase].push(currentArgument);
                                result.arguments[optionFormat.camelCase].push(currentArgument);
                                argumentIndex++;
                            }
                        } else {
                            // all the rest of option types are single values following the --option
                            if (argumentIndex > commandArguments.length - 1) {
                                // if this is the last argument, there is no value specified.
                                // set the argument value to undefined
                                this.setOptionValue(result.arguments, optionName, optionFormat, undefined);
                            } else {
                                argumentIndex++;
                                currentArgument = commandArguments[argumentIndex];
                                let optionValue: any = currentArgument;
                                if (option.type === "number") {
                                    // if it's a number type, try to parse the number like yargs does
                                    const BASE_TEN = 10;
                                    optionValue = parseInt(optionValue, BASE_TEN);
                                }
                                this.setOptionValue(result.arguments, optionName, optionFormat, optionValue);
                            }
                        }
                    }
                }
            }
            argumentIndex++;
        }
        result.commandToInvoke = currentCommand;
        return result;
    }

    private static isDashOption(argument: string) {
        return argument.charAt(0) === "-";
    }

    /**
     * Set an option for all the various versions of an option's name including kebab case and camel case.
     * @param args - the command arguments to set the option value on
     * @param optionName - the original option name entered by the user. could be an alias or an option name
     * @param optionFormat - the various formats of the option including kebab case and camel case. We will set the value
     *                       for all formats
     * @param value - the value to set for the option
     */
    private static setOptionValue(args: ICommandArguments, optionName: string, optionFormat: IOptionFormat, value: any) {
        args[optionName] = value;
        args[optionFormat.kebabCase] = value;
        args[optionFormat.camelCase] = value;
    }

    private static findOptionInCommand(optionName: string, command: ICommandDefinition): ICommandOptionDefinition {
        if (optionName === Constants.HELP_OPTION || optionName === Constants.HELP_OPTION_ALIAS) {
            return {
                name: Constants.HELP_OPTION, aliases: [Constants.HELP_OPTION_ALIAS],
                type: "boolean",
                description: "Display the help"
            };
        }
        if (optionName === Constants.JSON_OPTION || optionName === Constants.JSON_OPTION_ALIAS) {
            return {
                name: Constants.JSON_OPTION, aliases: [Constants.JSON_OPTION_ALIAS],
                type: "boolean",
                description: "Display the help"
            };
        }
        for (const option of command.options) {
            this.log.trace("Comparing option %s with entered option %s", option.name, optionName);
            if (option.name.trim() === optionName) {
                this.log.trace("Found match for argument '%s' with option name '%s'",
                    optionName, option.name);
                return option;
            } else {
                for (const alias of option.aliases) {
                    if (alias === optionName) {
                        this.log.trace("Found alias for option. Alias %s matches option name %s",
                            alias, optionName);
                        return option;
                    }
                }
            }
        }

        return undefined; // not found
    }

    private static get log(): any {
        return {  // mocked logger for testing
            trace: (...args: any[]) => {
                console.log.apply(this, args);
            }
        };
        // return Logger.getImperativeLogger();
    }
}
