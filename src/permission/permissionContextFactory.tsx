import React, { useState, useEffect, createContext, useContext } from "react";
import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as R from "fp-ts/lib/Record";
import * as RD from "@devexperts/remote-data-ts";
import { PermissionError, netError, decodeError } from "./ErrorHandling";
import {
  CodecType,
  ReturnType,
  ProvidePermissionProps,
  PCFReturnType,
  CheckPermissionProps,
  CodecPermissionRecord,
  DebugOptions,
  States,
} from "./types";
import { foldPermission, mapCodecTo } from "./utils";

// api call
function getAuthorizations<I extends CodecPermissionRecord>(): TE.TaskEither<
  PermissionError<I>,
  unknown
> {
  return TE.tryCatch(
    () => fetch("/authorizations").then((res) => res.json()),
    (err) => netError(err)
  );
}

function decodeResponse<I extends CodecPermissionRecord>(
  response: unknown,
  codec: CodecType<I>,
  deniedValue: ReturnType<I>
): E.Either<PermissionError<I>, ReturnType<I>> {
  // cast is necessary because Record contains also number and symbol :(
  const mapToReturn = (R.map<boolean, States>((v) =>
    v ? "Granted" : "Denied"
  ) as unknown) as (fa: Record<keyof I, boolean>) => Record<keyof I, States>;
  return pipe(
    codec.decode(response),
    E.bimap((e) => decodeError({ e, response, deniedValue }), mapToReturn)
  );
}

// hook that stores the result and does the validation with the codec
function useProvidePermissions<I extends CodecPermissionRecord>(
  codec: CodecType<I>,
  deniedValue: ReturnType<I>
): RD.RemoteData<PermissionError<I>, ReturnType<I>> {
  const [auth, setAuth] = useState<
    RD.RemoteData<PermissionError<I>, ReturnType<I>>
  >(RD.initial);

  useEffect(() => {
    const newValue = pipe(
      getAuthorizations<I>(),
      TE.chain((response) =>
        TE.fromEither(decodeResponse(response, codec, deniedValue))
      )
    );
    newValue().then((nw) => {
      setAuth(RD.fromEither(nw));
    });
  }, [codec]);

  return auth;
}

export function calculateAuthState<I extends CodecPermissionRecord>(
  value: ReturnType<I>,
  roles: (keyof I)[]
): States {
  const values = Object.values(value);
  if (values.length === 0) return "Denied";
  if (values[0] === "Loading") return "Loading";

  const isAuthorized: boolean = pipe(
    value,
    R.filterWithIndex((k) => roles.includes(k)),
    R.some((a) => a === "Granted")
  );

  return isAuthorized ? "Granted" : "Denied";
}

/**
 * This factory returns the Context Element that needs to be used in the fragset and the permission hook that reads the permission.
 * The strings cames directly from Keycloack roles. Remember that we are using two realms that have different permission.
 *
 * If any permission that does not exist is used, it's always set to 'Denied'
 *
 * @param debugOptions.debug if set to true, in case there is any unknown permission in the list a detailed error message is shown.
 * @param debugOptions.overrideWith this param if set it will override the response, useful for testing.
 *
 * @example
 * import * as t from "io-ts";
 *
 * const Permission = t.type({
 *   my_permission: t.boolean
 * });
 *
 * const { ProvidePermission, usePermission, CheckPermission } = permissionContextFactory(
 *   Permission
 * );
 *
 * function MyComponent() {
 *   return (
 *     <ProvidePermission>
 *       <OtherComponent />
 *     </ProvidePermission>
 *   );
 * }
 *
 * // OtherComponent
 *
 * function OtherComponent() {
 *   const permission = usePermission();
 *
 *   switch (permission.my_permission) {
 *     case "Denied":
 *       return <AccessDenied />;
 *     case "Granted":
 *       return <AccessGranted />;
 *     case "Loading":
 *       return <Loading />;
 *   }
 * }
 *
 */
export function permissionContextFactory<I extends CodecPermissionRecord>(
  codec: CodecType<I>,
  debugOptions: DebugOptions<I> = { debug: false }
): PCFReturnType<I> {
  const loadingValue = mapCodecTo(codec, "Loading");
  const deniedValue = mapCodecTo(codec, "Denied");
  const PermissionContext = createContext(loadingValue);

  function ProvidePermission({ children }: ProvidePermissionProps) {
    const RDPermission = useProvidePermissions(codec, deniedValue);

    const { Component, permission } = foldPermission({
      RDPermission,
      debugOptions,
      deniedValue,
      loadingValue,
      children,
    });

    return (
      <PermissionContext.Provider value={permission}>
        {Component}
      </PermissionContext.Provider>
    );
  }

  const usePermission: () => ReturnType<I> = () => {
    return useContext(PermissionContext);
  };

  function CheckPermission({
    children,
    Denied,
    Loading,
    roles,
  }: CheckPermissionProps<I>) {
    const value = usePermission();

    const isAuthorized = calculateAuthState(value, roles);

    switch (isAuthorized) {
      case "Granted":
        return children || null;
      case "Denied":
        return Denied || null;
      case "Loading":
        return Loading || null;
    }
  }

  return {
    ProvidePermission,
    usePermission,
    CheckPermission,
  };
}
