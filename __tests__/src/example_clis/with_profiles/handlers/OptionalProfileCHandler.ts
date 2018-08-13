/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*/

import {ICommandHandler, IHandlerParameters} from "../../../../../packages/cmd";

export default class OptionalProfileCHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        const profile = params.profiles.get("profile-c", false);
        params.response.console.log(`Profile Cs loaded: ${profile}`)
    }
}
