import { ICommandHandler, IHandlerParameters } from "../../../../../../cmd";
import { ImperativeShell } from "../../../api/ImperativeShell";
import { Imperative } from "../../../../Imperative";

/**
 * Handler for the "start shell" command
 */
export default class ShellHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        await new ImperativeShell(params.fullDefinition).start();
    }
}
