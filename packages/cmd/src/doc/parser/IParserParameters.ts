import { ICommandDefinition } from "../ICommandDefinition";

export interface IParserParameters {
    fullDefinitionTree: ICommandDefinition;
    primaryCommands: string[];
}
