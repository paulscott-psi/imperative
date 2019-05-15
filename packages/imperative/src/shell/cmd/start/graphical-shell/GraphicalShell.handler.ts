import { ICommandHandler, IHandlerParameters } from "../../../../../../cmd";
import { ImperativeShell } from "../../../api/ImperativeShell";
import { ImperativeConfig } from "../../../../ImperativeConfig";
import { GraphicalShell } from "../../../api/GraphicalShell";

/**
 * Handler for the "start shell" command
 */
export default class GraphicalShellHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        const primaryCommands = Object.keys(ImperativeConfig.instance.callerPackageJson.bin);
        await new GraphicalShell(ImperativeConfig.instance.getPreparedCmdTree(ImperativeConfig.instance.resolvedCmdTree),
            primaryCommands).start();
    }
}
