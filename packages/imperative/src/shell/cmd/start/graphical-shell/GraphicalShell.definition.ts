import { ICommandDefinition } from "../../../../../../cmd";

export const graphicalShellDefinition: ICommandDefinition = {
    name: "graphical-shell", aliases: ["gs"],
    summary: "Start an interactive shell using terminal graphics.",
    description: "Start an interactive shell using terminal graphics. May not work in all shells",
    type: "command",
    handler: __dirname + "/GraphicalShell.handler"
};

