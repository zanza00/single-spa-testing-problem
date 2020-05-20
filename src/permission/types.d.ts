import * as t from "io-ts";
import * as React from "react";

export type CodecPermissionRecord = Record<string, t.BooleanC>;
export type States = "Loading" | "Denied" | "Granted";

export type CodecType<I extends CodecPermissionRecord> = t.TypeC<I>;
type ReturnType<I extends CodecPermissionRecord> = Record<keyof I, States>;

type Roles = 0;

export type DebugOptions<I extends CodecPermissionRecord> =
  | {
      debug: true;
      overrideWith?: ReturnType<I>;
    }
  | { debug: false };

// context stuff
export type ProvidePermissionProps = {
  children: React.ReactNode;
};

export type CheckPermissionProps<I extends CodecPermissionRecord> = {
  roles: (keyof ReturnType<I>)[];
  children?: JSX.Element;
  Denied?: JSX.Element;
  Loading?: JSX.Element;
};

export type PCFReturnType<I extends CodecPermissionRecord> = {
  ProvidePermission: ({ children }: ProvidePermissionProps) => JSX.Element;
  usePermission: () => ReturnType<I>;
  CheckPermission: (props: CheckPermissionProps<I>) => JSX.Element | null;
};
