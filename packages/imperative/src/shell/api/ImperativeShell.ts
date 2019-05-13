import * as readline from "readline";
import { ICommandDefinition } from "../../../../cmd";
import { Parser } from "../../../../cmd/src/parser/Parser";

export class ImperativeShell {

    private yargs = require("yargs");

    /**
     * Create a new imperative shell
     * @param commandTree - full command tree of your CLI
     */
    constructor(
        private commandTree: ICommandDefinition,
        private primaryCommands: string[]
    ) {
        // do nothing
    }

    public start(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const rl = readline.createInterface(process.stdin, process.stdout, this.completeCommand);
            rl.on("error", (err: Error) => {
                rl.close();
                reject(err);
            });
            rl.prompt();

            rl.on("line", (cmd: string) => {
                rl.pause();

                const exitCheck = cmd.trim().toLowerCase();
                if (exitCheck === "exit" || exitCheck === "quit" || exitCheck === "bye") {
                    process.stdout.write("Exit acknowledged.\n");
                    resolve();
                } else if (exitCheck === "clear" || exitCheck === "cls") {
                    process.stdout.write("\u001B[2J\u001B[0;0f"); // this insane sequence clears the screen
                    rl.prompt();
                } else {
                    const parsedArgs = Parser.parse(cmd, {
                        fullDefinitionTree: this.commandTree,
                        primaryCommands: this.primaryCommands
                    });
                    delete parsedArgs.commandToInvoke.children;
                    process.stdout.write(JSON.stringify(parsedArgs, null, 2) + "\n");
                    rl.prompt();
                }

            });

            rl.on("end", () => {
                process.stdout.write("End of input\n");
                rl.close();
                resolve();
            });
        });
    }

    /**
     * Given user input, determine the auto complete text to suggest to the user
     * @param command - the command entered so far
     * @returns [[potential completions], the original command line]
     */
    public completeCommand(command: string): any {
        return [["hellohello"], command];
    }
}
