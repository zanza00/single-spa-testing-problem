import React from "react";
import * as RD from "@devexperts/remote-data-ts";
import { foldPermission } from "./utils";
import { decodeError } from "./ErrorHandling";
import { iotsError } from "./index.test";

describe("Fold Permission", () => {
  it("returns the permissions when there are all permission", () => {
    const RDPermission = RD.success({ test: "Granted" } as const);
    const { permission } = foldPermission({
      children: <div />,
      debugOptions: { debug: false },
      loadingValue: { test: "Loading" },
      deniedValue: { test: "Denied" },
      RDPermission,
    });
    expect(permission).toEqual({ test: "Granted" });
  });
  it("returns the permissions with a non present key set to denied", () => {
    const RDPermission = RD.failure(
      decodeError({
        e: iotsError,
        deniedValue: { test: "Denied", notpresent: "Denied" },
        response: { test: true },
      })
    );
    const { permission } = foldPermission({
      children: <div />,
      debugOptions: { debug: false },
      loadingValue: { test: "Loading", notpresent: "Loading" },
      deniedValue: { test: "Denied", notpresent: "Denied" },
      RDPermission,
    });
    expect(permission).toEqual({ test: "Granted", notpresent: "Denied" });
  });
  it("return the loading state", () => {
    const RDPermission = RD.initial;
    const { permission } = foldPermission({
      children: <div />,
      debugOptions: { debug: false },
      loadingValue: { test: "Loading" },
      deniedValue: { test: "Denied" },
      RDPermission,
    });
    expect(permission).toEqual({ test: "Loading" });
  });
  describe("debug behaviour", () => {
    it("display the debug component when debug is enabled", () => {
      const RDPermission = RD.failure(
        decodeError({
          e: iotsError,
          deniedValue: { test: "Denied", unknown: "Denied" },
          response: { test: true },
        })
      );
      const { Component } = foldPermission({
        children: <div />,
        loadingValue: { test: "Loading", unknown: "Loading" },
        deniedValue: { test: "Denied", unknown: "Loading" },
        RDPermission,
        debugOptions: { debug: true },
      });
      expect(Component).not.toEqual(<div />);
    });
    it("display the proper component when debug is turned off", () => {
      const deniedValue = {
        test: "Denied" as const,
        unknown: "Denied" as const,
      };
      const RDPermission = RD.failure(
        decodeError({
          e: iotsError,
          deniedValue,
          response: { test: true },
        })
      );
      const { Component, permission } = foldPermission({
        children: <div />,
        debugOptions: { debug: false },
        deniedValue,
        loadingValue: { test: "Loading", unknown: "Loading" },
        RDPermission,
      });
      expect(Component).toEqual(<div />);
      expect(permission).toEqual({ test: "Granted", unknown: "Denied" });
    });
    it("uses the override permission when used in case of error", () => {
      const RDPermission = RD.failure(
        decodeError({
          e: iotsError,
          deniedValue: { test: "Denied", unknown: "Denied" },
          response: { test: true },
        })
      );
      const { permission } = foldPermission({
        children: <div />,
        debugOptions: {
          debug: true,
          overrideWith: { test: "Granted", unknown: "Granted" },
        },
        deniedValue: { test: "Denied", unknown: "Denied" },
        loadingValue: { test: "Loading", unknown: "Loading" },
        RDPermission,
      });
      expect(permission).toEqual({ test: "Granted", unknown: "Granted" });
    });
    it("uses the override permission when used in case of a good response", () => {
      const RDPermission = RD.success({
        test: "Denied" as const,
        unknown: "Denied" as const,
      });
      const { permission } = foldPermission({
        children: <div />,
        debugOptions: {
          debug: true,
          overrideWith: { test: "Granted", unknown: "Granted" },
        },
        deniedValue: { test: "Denied", unknown: "Denied" },
        loadingValue: { test: "Loading", unknown: "Loading" },
        RDPermission,
      });
      expect(permission).toEqual({ test: "Granted", unknown: "Granted" });
    });
  });
});
