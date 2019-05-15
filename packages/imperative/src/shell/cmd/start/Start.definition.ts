import { ICommandDefinition } from "../../../../../cmd";
import { shellDefinition } from "./shell/Shell.definition";

export const startDefinition: ICommandDefinition = {
    name: "start",
    description: "Start an interactive shell",
    type: "group",
    children: [shellDefinition]
};
