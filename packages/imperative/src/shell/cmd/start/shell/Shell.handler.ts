import { ICommandHandler, IHandlerParameters } from "../../../../../../cmd";
import { ImperativeShell } from "../../../api/ImperativeShell";
import { Imperative } from "../../../../Imperative";
import { ImperativeConfig } from "../../../../ImperativeConfig";

/**
 * Handler for the "start shell" command
 */
export default class ShellHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        const primaryCommands =  Object.keys(ImperativeConfig.instance.callerPackageJson.bin);
        await new ImperativeShell(ImperativeConfig.instance.resolvedCmdTree, primaryCommands).start();
    }
}
