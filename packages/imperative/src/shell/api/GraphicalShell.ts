import { ICommandDefinition } from "../../../../cmd";

const blessed = require("neo-blessed");

export class GraphicalShell {

    public constructor(private commandTree: ICommandDefinition,
                       private primaryCommands: string[]) {
        // initialize the graphical shell class
    }

    public async start() {
        return new Promise((resolve, reject) => {
                try {
                    // Create a screen object.
                    const screen = blessed.screen({
                        smartCSR: true
                    });

                    screen.title = "Graphical Shell";

                    const cmdBox = blessed.Textbox({
                        top: "left",
                        left: "left",
                        width: "90%",
                        height: "20%",
                        content: "Hello {bold}world{/bold}!",
                        tags: true,
                        border: {
                            type: "none"
                        },
                        style: {
                            fg: "cyan",
                            bg: "black",
                            border: {
                                fg: "#f0f0f0"
                            },
                        }
                    });

                    // Focus our element.
                    cmdBox.focus();
                    // Append our box to the screen.
                    screen.append(cmdBox);

                    // If box is focused, handle `enter`/`return` and give us some more content.
                    cmdBox.on("submit", (data: any) => {
                        console.log("You entered: " + data + "\n");
                        screen.render();
                    });

                    // Quit on Escape, q, or Control-C.
                    screen.key(["escape", "C-c"], (ch: any, key: any) => {
                        screen.destroy();
                        resolve();
                    });


                    // Render the screen.
                    screen.render();
                } catch (blessedErr) {
                    reject(blessedErr);
                }
            }
        );
    }
}
