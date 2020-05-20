import React from "react";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/pipeable";
import * as E from "fp-ts/lib/Either";
import * as R from "fp-ts/lib/Record";
import { CodecPermissionRecord, ReturnType } from "./types";

// error handling
type DecodeError<I extends CodecPermissionRecord> = {
  type: "DecodeError";
  missingKeys: string[];
  permissionResponse: Record<string, boolean>;
  mergeResponseAndCodec: ReturnType<I>;
};
type NetError = {
  type: "NetError";
  message: string;
};
export type PermissionError<I extends CodecPermissionRecord> =
  | DecodeError<I>
  | NetError;
// Error constructor
type DecodeErrorParams<I extends CodecPermissionRecord> = {
  e: t.Errors;
  response: unknown;
  deniedValue: ReturnType<I>;
};

//exported for testing
export function decodeError<I extends CodecPermissionRecord>({
  e,
  response,
  deniedValue,
}: DecodeErrorParams<I>): PermissionError<I> {
  const missingKeys = e.map((e) => e.context.map(({ key }) => key).join(""));
  const permissionResponse = pipe(
    t.record(t.string, t.boolean).decode(response),
    E.map(R.map((v) => (v ? "Granted" : "Denied"))),
    E.getOrElse(() => ({}))
  );

  const mergeResponseAndCodec = { ...deniedValue, ...permissionResponse };

  return {
    type: "DecodeError",
    missingKeys,
    permissionResponse,
    mergeResponseAndCodec,
  };
}

export function netError<I extends CodecPermissionRecord>(
  err: unknown
): PermissionError<I> {
  return {
    type: "NetError",
    message: JSON.stringify(err),
  };
}

function MissingKeysComponent<I extends CodecPermissionRecord>(
  props: DecodeError<I>
) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1 style={{ color: "red", fontSize: 45 }}>⚠️ Permission Error ⚠️</h1>
      <h2>This is a debug message</h2>
      <div style={{ fontSize: 20 }}>
        <p>
          I don't know what these permission are:{" "}
          <b>{props.missingKeys.join()}</b>
        </p>
        <p>This are the response of the Permission</p>
        <ul>
          {Object.entries(props.permissionResponse).map(([key, value]) => (
            <li key={key}>{`${key}: ${value}`}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function UnableToConnectComponent(props: NetError) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1 style={{ color: "orange", fontSize: 45 }}>⚠️ Network Error ⚠️</h1>
      <h2>This is a debug message</h2>
      <div style={{ fontSize: 20 }}>
        <p>
          I cannot reach <code>"/authorizations"</code>
        </p>
        <code>{props.message}</code>
      </div>
    </div>
  );
}

export function renderError<I extends CodecPermissionRecord>(
  e: PermissionError<I>
): JSX.Element {
  switch (e.type) {
    case "NetError":
      return <UnableToConnectComponent {...e} />;
    case "DecodeError":
      return <MissingKeysComponent {...e} />;
  }
}

export function getvaluefromError<I extends CodecPermissionRecord>(
  e: PermissionError<I>,
  deniedValue: ReturnType<I>
): ReturnType<I> {
  switch (e.type) {
    case "DecodeError":
      return e.mergeResponseAndCodec;
    case "NetError":
      return deniedValue;
  }
}
