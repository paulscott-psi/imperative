import { ICommandHandler, IHandlerParameters } from "../../../../../../cmd";

/**
 * Handler for the "start shell" command
 */
export default class ShellHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        params.response.console.log("Wow what a great shell");
    }
}
