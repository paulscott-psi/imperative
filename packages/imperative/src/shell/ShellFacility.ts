import { ImperativeConfig } from "../ImperativeConfig";
import { startDefinition } from "./cmd/start/Start.definition";
import { Logger } from "../../../logger";
import { viewDefinition } from "./cmd/view/View.definition";

export class ShellFacility{

    /**
     * This is the variable that stores the specific instance of the Shell facility. Defined
     * as static so that it can be accessed from anywhere.
     *
     * @private
     * @type {ConfigManagementFacility}
     */
    private static mInstance: ShellFacility;

    /**
     * Used for internal imperative logging.
     *
     * @private
     * @type {Logger}
     */
    private impLogger: Logger = Logger.getImperativeLogger();

    /**
     * Gets a single instance of the CMF. On the first call of
     * ConfigManagementFacility.instance, a new CMF is initialized and returned.
     * Every subsequent call will use the one that was first created.
     *
     * @returns {ConfigManagementFacility} - The newly initialized CMF object.
     */
    public static get instance(): ShellFacility {
        if (this.mInstance == null) {
            this.mInstance = new ShellFacility();
        }

        return this.mInstance;
    }

    /**
     * Add the definitions to the command tree
     */
    public init(){
        // Add the shell group and related commands.
        ImperativeConfig.instance.addCmdGrpToLoadedConfig({
            name: "shell",
            type: "group",
            summary: "Start an interactive shell",
            description: "Start an interactive shell",
            children: [
                startDefinition,
                viewDefinition
            ]
        });
    }
}
