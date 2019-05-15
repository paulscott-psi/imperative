import { ICommandDefinition } from "../../../../../cmd";
import { commandTreeDefinition } from "./shell/CommandTree.definition";

export const viewDefinition: ICommandDefinition = {
    name: "view",
    description: "View info for this CLI",
    type: "group",
    children: [commandTreeDefinition]
};
