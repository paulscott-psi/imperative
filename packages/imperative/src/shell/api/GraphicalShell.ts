import { ICommandDefinition } from "../../../../cmd";

const blessed = require("neo-blessed");

export class GraphicalShell {

    public constructor(private commandTree: ICommandDefinition,
                       private primaryCommands: string[]) {
        // initialize the graphical shell class
    }

    public async start() {
        return new Promise((resolve, reject) => {
                let screen: any;
                try {
                    // Create a screen object.
                    screen = blessed.screen({
                        smartCSR: true
                    });

                    screen.title = "Graphical Shell";

                    const cmdBox = blessed.textbox({
                        inputOnFocus: true,
                        parent: screen,
                        top: 0,
                        left: 0,
                        height: 6,
                        width: "90%",
                        content: "Hello",
                        tags: true,
                        border: {
                            type: "none"
                        },
                        style: {
                            fg: "white",
                            bg: "blue",
                        }
                    });

                    // Focus our element.
                    cmdBox.focus();
                    // Append our box to the screen.
                    screen.append(cmdBox);

                    // If box is focused, handle `enter`/`return` and give us some more content.
                    cmdBox.on("submit", (data: any) => {
                        cmdBox.focus();
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
                    if (screen) {
                        screen.destroy();
                    }
                    reject(blessedErr);
                }
            }
        );
    }
}
