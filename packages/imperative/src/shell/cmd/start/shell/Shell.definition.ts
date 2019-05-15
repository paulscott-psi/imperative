import { ICommandDefinition } from "../../../../../../cmd";

export const shellDefinition: ICommandDefinition = {
    name: "shell", aliases: ["s"],
    description: "Start an interactive shell",
    type: "command",
    handler: __dirname + "/Shell.handler"
};

