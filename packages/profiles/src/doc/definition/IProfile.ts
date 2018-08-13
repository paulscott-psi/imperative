/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*/

/**
 * Profiles are a user configuration mechanism built into the Imperative framework and profiles are intended to be
 * exploited on commands that require large sets of configuration items (more than would be feasible on the command
 * line). In addition, profiles allow users to dynamically and easily switch configuration for the invocation of a
 * particular command. One common use case for profiles, is storing "connection details" (host, user, API version,
 * port, credentials, etc.) required by a command to communicate with a remote instance/service.
 *
 * Another feature of profiles are "dependencies". A profile can "point to" any number of additional profiles, which
 * will be loaded when the original is loaded. A common use case for this feature is if you need "connection
 * details" (to communicate with a remote instance), but the unique serivce you are invoking also requires additional
 * input/configuration. You can "point to", via the dependencies, the "connection details" profile.
 *
 * Profiles also help you segregate/isolate portions of your CLI (if it is complex enough to warrent). For example,
 * a common pattern is to organize your CLI via "groups", where each group is isolated and requires seperate
 * configuration.
 *
 * Profiles are loaded (sometimes automatically, by definition on your commands) for the invocation of that command.
 * Meaning, they are only loaded when needed/required.
 *
 * See the "ProfileManager" for profile management details.
 *
 * @export
 * @interface IProfile
 */
export interface IProfile {
    /**
     * The name of the profile. Cannot be blank/null. The name is used to refer to the profile (in context of the
     * type) and is used as the file name when written/read from disk.
     * @type {string}
     * @memberof IProfile
     */
    name?: string;
    /**
     * The profile "type" is used to segregate/isolate configuration profiles. The profile name, plus the type,
     * uniquely qualify a profile (the profile manager uses the type to organize the profiles on disk, so names
     * do NOT need to be unique across types). The type is arbitrary, but must be defined on your Imperative config.
     * A common usage for profile types, is to support complex CLI configurations, where potentially each group
     * or set of commands in your CLI can have it's own configuration.
     * @type {string}
     * @memberof IProfile
     */
    type?: string;
    /**
     * The list of profile that this profile is dependent on. Can be explicitly named (for tight  coupling of
     * interdependent profiles). Profile dependencies are useful to help complex CLIs segregate/isolate profile (and
     * for example, command groups) configurations, while allowing for reuse of configuration where needed. A profile
     * can have any number of dependencies of any type.
     * @type {string}
     * @memberof IProfile
     */
    dependencies?: Array<{
        /**
         * The name of the profile this profile is dependent on - profile+type uniquely qualify a profile.
         * @type {string}
         */
        name?: string;
        /**
         * The type of the profile this profile is dependent on - profile+type uniquely qualify a profile.
         * @type {string}
         */
        type: string;
    }>;
    /**
     * Indexable.
     */
    [key: string]: any;

    /**
     * Note:
     * Among the keys included in the profile, there will be two special ones.
     *   @type {string} username - The username to be securely saved to this profile.
     *   @type {string} password - The password for the username to be securely saved to this profile.
     * The above keys should never be saved in a dedicated file for this profile.
     * Instead, they will only be securely stored and reterieved by the CredentialManager.
     */
}
