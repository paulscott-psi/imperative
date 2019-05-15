import { ICommandHandler, IHandlerParameters } from "../../../../../../cmd";
import { ImperativeConfig } from "../../../../ImperativeConfig";
import { GraphicalCommandTreeBrowser } from "../../../api/GraphicalCommandTreeBrowser";
import { Imperative } from "../../../../Imperative";

/**
 * Handler for the "start shell" command
 */
export default class CommandTreeHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        const browser = new GraphicalCommandTreeBrowser(ImperativeConfig.instance.getPreparedCmdTree(ImperativeConfig.instance.resolvedCmdTree),
            Imperative.rootCommandName);
        await browser.start();
    }
}
