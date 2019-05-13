import { ICommandArguments, ICommandDefinition } from "../../..";

export interface IParseResult {
    /**
     * Arguments object parsed from the command
     */
    arguments: ICommandArguments;

    /**
     * The command to invoke if parsing is completely successful
     */
    commandToInvoke?: ICommandDefinition;

}

