import { ICommandArguments, ICommandDefinition } from "../../..";

export interface IParseResult {
    /**
     * Arguments object parsed from the command
     */
    arguments: ICommandArguments;

    /**
     * Was the parsing completely successful? No unknown values if true
     */
    success: boolean;

    /**
     * Any arguments that couldn't be parsed
     * Only populated if success is false
     */
    unknownArguments: string[];

    /**
     * The command to invoke if parsing is successful
     */
    commandToInvoke?: ICommandDefinition;

}

