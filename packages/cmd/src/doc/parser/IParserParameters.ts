import { ICommandDefinition } from "../ICommandDefinition";

/**
 * Parameters for parsing a command
 */
export interface IParserParameters {
    /**
     * The full tree of definitions from your CLI
     */
    fullDefinitionTree: ICommandDefinition;
    /**
     * The primary command for the CLI
     * Usually found in your "bin" field of package.json
     */
    primaryCommand: string;

    /**
     * The command issued by the user
     */
    commandStringOrArguments: string | string[];
}
