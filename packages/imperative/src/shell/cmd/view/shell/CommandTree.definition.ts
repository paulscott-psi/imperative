import { ICommandDefinition } from "../../../../../../cmd";

export const commandTreeDefinition: ICommandDefinition = {
    name: "command-tree", aliases: ["ct"],
    description: "Interactively view all commands for this CLI",
    type: "command",
    handler: __dirname + "/CommandTree.handler"
};

