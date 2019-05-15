const blessed = require("neo-blessed");

export class GraphicalShell {

    public async start() {
        return new Promise((resolve, reject) => {
                try {
                    // Create a screen object.
                    const screen = blessed.screen({
                        smartCSR: true
                    });

                    screen.title = "Graphical Shell";

                    // Create a box perfectly centered horizontally and vertically.
                    const box = blessed.box({
                        top: "top",
                        left: "left",
                        width: "90%",
                        height: "20%",
                        content: "Hello {bold}world{/bold}!",
                        tags: true,
                        border: {
                            type: "none"
                        },
                        style: {
                            fg: "white",
                            bg: "magenta",
                            border: {
                                fg: "#f0f0f0"
                            },
                            hover: {
                                bg: "green"
                            }
                        }
                    });

                    // Append our box to the screen.
                    screen.append(box);

                    // Add a png icon to the box
                    //         const icon = blessed.image({
                    //             parent: box,
                    //             top: 0,
                    //             left: 0,
                    //             type: "overlay",
                    //             width: "shrink",
                    //             height: "shrink",
                    //             file: __dirname + "/my-program-icon.png",
                    //             search: false
                    //         });

                    // If our box is clicked, change the content.
                    box.on("click", (data: any) => {
                        box.setContent("{center}Some different {red-fg}content{/red-fg}.{/center}");
                        screen.render();
                    });

                    // If box is focused, handle `enter`/`return` and give us some more content.
                    box.key("enter", (ch: any, key: any) => {
                        box.setContent("{right}Even different {black-fg}content{/black-fg}.{/right}\n");
                        box.setLine(1, "bar");
                        box.insertLine(1, "foo");
                        screen.render();
                    });

                    // Quit on Escape, q, or Control-C.
                    screen.key(["escape", "C-c"], (ch: any, key: any) => {
                        screen.destroy();
                        resolve();
                    });

                    // Focus our element.
                    box.focus();

                    // Render the screen.
                    screen.render();
                } catch (blessedErr) {
                    reject(blessedErr);
                }
            }
        );
    }
}
