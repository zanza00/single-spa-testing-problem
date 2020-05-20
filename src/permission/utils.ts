import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import * as RD from "@devexperts/remote-data-ts";
import {
  PermissionError,
  getvaluefromError,
  renderError,
} from "./ErrorHandling";
import {
  CodecType,
  ReturnType,
  CodecPermissionRecord,
  DebugOptions,
  States,
} from "./types";

export function mapCodecTo<I extends CodecPermissionRecord>(
  codec: CodecType<I>,
  value: States
): ReturnType<I> {
  return (pipe(
    codec.props,
    R.map(() => value)
  ) as unknown) as ReturnType<I>;
}

type FoldPermissionParams<I extends CodecPermissionRecord> = {
  RDPermission: RD.RemoteData<PermissionError<I>, ReturnType<I>>;
  deniedValue: ReturnType<I>;
  loadingValue: ReturnType<I>;
  debugOptions: DebugOptions<I>;
  children: React.ReactNode;
};
type FoldPermissionReturn<I extends CodecPermissionRecord> = {
  permission: ReturnType<I>;
  Component: React.ReactNode;
};

//export for testing
export function foldPermission<I extends CodecPermissionRecord>({
  RDPermission,
  children,
  deniedValue,
  loadingValue,
  debugOptions,
}: FoldPermissionParams<I>): FoldPermissionReturn<I> {
  return pipe(
    RDPermission,
    RD.fold(
      // Initial
      () => {
        return {
          permission: loadingValue,
          Component: children,
        };
      },
      // Pending
      () => {
        return {
          permission: loadingValue,
          Component: children,
        };
      },
      // Error
      (e) => {
        switch (debugOptions.debug) {
          case true:
            return {
              permission:
                debugOptions.overrideWith !== undefined
                  ? debugOptions.overrideWith
                  : getvaluefromError(e, deniedValue),
              Component: renderError(e),
            };
          case false:
            return {
              permission: getvaluefromError(e, deniedValue),
              Component: children,
            };
        }
      },
      // Success
      (perm) => {
        switch (debugOptions.debug) {
          case true:
            return {
              permission:
                debugOptions.overrideWith !== undefined
                  ? debugOptions.overrideWith
                  : perm,
              Component: children,
            };
          case false:
            return {
              permission: perm,
              Component: children,
            };
        }
      }
    )
  );
}
