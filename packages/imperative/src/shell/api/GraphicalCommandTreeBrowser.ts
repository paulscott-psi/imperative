import { ICommandDefinition, ICommandExampleDefinition } from "../../../../cmd";
import { TextUtils } from "../../../../utilities";

const blessed = require("neo-blessed");
const contrib = require("neo-blessed-contrib");

export class GraphicalCommandTreeBrowser {

    public constructor(private commandTree: ICommandDefinition,
                       private binName: string) {
        // new instance of tree browser now
    }

    public async start() {
        return new Promise((resolve, reject) => {
                try {
                    // Create a screen object.
                    const screen = blessed.screen({
                        smartCSR: true
                    });

                    screen.title = "Command Tree Browser";
                    screen.on("resize", () => {
                        screen.render();
                    });
                    // Create a box perfectly centered horizontally and vertically.
                    const tree = contrib.tree({height: "90%", fg: "yellow"});
                    const box = blessed.box({
                        right: 0,
                        width: "50%",
                        height: "100%",
                        content: " ",
                        scrollable: true,
                        tags: true,
                        border: {
                            type: "none"
                        },
                        style: {
                            fg: "white",
                            bg: "black",
                            hover: {
                                bg: "green"
                            }
                        }
                    });
                    // allow control the table with the keyboard
                    tree.focus();

                    tree.on("select", (node: any) => {
                        if (node.description && node.fullCommand) {
                            let content = node.fullCommand + "\n\n" + node.description;

                            if (node.examples) {
                                content += "\n\nExamples:\n\n";
                                content += node.examples.map((example: ICommandExampleDefinition) => {
                                    return example.description + ":\n" +
                                        TextUtils.chalk.yellow((example.prefix || "") + node.fullCommand + " " + example.options);
                                }).join("\n");
                            }
                            box.setContent(content);
                        }
                        screen.render();
                    });

                    const commandTreeData: any = {extended: true};
                    const addChildren = (treeData: any, children: ICommandDefinition[], fullCommandSoFar: string) => {
                        if (children == null) {
                            return;
                        }
                        treeData.children = {};
                        for (const child of children) {
                            const childKey = fullCommandSoFar + " " + child.name;
                            treeData.children[childKey] = {
                                description: child.description, examples: child.examples,
                                fullCommand: fullCommandSoFar + " " + child.name,
                                name: child.name
                            };
                            // add grandchildren
                            addChildren(treeData.children[childKey], child.children, childKey);
                        }

                    };
                    addChildren(commandTreeData, this.commandTree.children, this.binName);

                    // you can specify a name property at root level to display root
                    tree.setData(
                        commandTreeData);
                    // Append our box to the screen.
                    screen.append(tree);
                    screen.append(box);
                    // Quit on Escape, q, or Control-C.
                    screen.key(["escape", "C-c"], (ch: any, key: any) => {
                        screen.destroy();
                        resolve();
                    });

                    // Focus our element.
                    tree.focus();

                    // Render the screen.
                    screen.render();
                } catch (blessedErr) {
                    reject(blessedErr);
                }
            }
        );
    }
}
