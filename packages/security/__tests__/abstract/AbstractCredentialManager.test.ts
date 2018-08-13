/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*/

import { AbstractCredentialManager, DefaultCredentialManager } from "../..";
import { ImperativeError } from "../../../error";
import { UnitTestUtils } from "../../../../__tests__/src/UnitTestUtils";

describe("AbstractCredentialManager", () => {
  // Constructor parameters for the manager
  const params = {
    service: "imperative"
  };

  // This is the test account
  const account = "test-account";

  // Setup the test credentials
  const username = "test-user";
  const password = "test-password";
  const credentials = {
    username,
    password,
    encoded: Buffer.from(`${username}:${password}`).toString("base64")
  };

  // These variables reference the manager that we are using to perform the abstract tests.
  let manager: AbstractCredentialManager;
  let privateManager: any;

  beforeEach(() => {
    manager = new DefaultCredentialManager(params.service);
    privateManager = manager;

    expect(privateManager.service).toEqual(params.service);

    // Mock the protected delete function
    privateManager.deleteCredentials = jest.fn(async () => undefined);

    // Mock the protected load function
    privateManager.loadCredentials = jest.fn(async () => credentials.encoded);

    // Mock the protected save function
    privateManager.saveCredentials = jest.fn(async () => undefined);
  });

  describe("delete", () => {
    it("should use the deleteCredentials method", async () => {
      await manager.delete(account);

      expect(privateManager.deleteCredentials).toHaveBeenCalledTimes(1);
      expect(privateManager.deleteCredentials).toHaveBeenCalledWith(account);
    });
  });

  describe("load", () => {
    it("should load a secure field", async () => {
      // Load and destructure the result
      const actualValue = await manager.load(account);

      expect(privateManager.loadCredentials).toHaveBeenCalledTimes(1);
      expect(privateManager.loadCredentials).toHaveBeenCalledWith(account);

      // Check that the decode happened
      expect(actualValue).toEqual(credentials.username + ":" + credentials.password);
    });
  });

  describe("save", () => {
    const errorMsg = "Missing Secure Field";

    it("should save username:password as a base64 encoded string", async () => {
      await manager.save(account, credentials.username + ":" + credentials.password);

      expect(privateManager.saveCredentials).toHaveBeenCalledTimes(1);
      expect(privateManager.saveCredentials).toHaveBeenCalledWith(account, credentials.encoded);
    });

    it("should throw an imperative error when the secure field is missing", async () => {
      const result = await UnitTestUtils.catchError(
        manager.save(account, undefined)
      );

      expect(result).toBeInstanceOf(ImperativeError);
      expect(result.message).toEqual(errorMsg);
    });

    it("should throw an imperative error when the secure field is empty", async () => {
      const result = await UnitTestUtils.catchError(
        manager.save(account, "")
      );

      expect(result).toBeInstanceOf(ImperativeError);
      expect(result.message).toEqual(errorMsg);
    });
  });
});

