import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { identity } from "fp-ts/lib/function";
import { decodeError, getvaluefromError } from "./ErrorHandling";

// mocking an io-ts error is hard
// it's easier to make one
export const iotsError = pipe(
  t.type({ test: t.boolean }).decode({}),
  E.fold(identity, () => [])
);

describe("Decode Error constructor", () => {
  it("can merge a good response and deniedValue", () => {
    const result = decodeError({
      e: iotsError,
      deniedValue: { a: "Denied", b: "Denied", c: "Denied" },
      response: { a: true, b: true },
    });
    const recoverResponse = getvaluefromError(result, {
      a: "Denied",
      b: "Denied",
      c: "Denied",
    });
    expect(recoverResponse).toEqual({
      a: "Granted",
      b: "Granted",
      c: "Denied",
    });
  });
  it("can merge handle a wrong response and deniedValue", () => {
    const result = decodeError({
      e: iotsError,
      deniedValue: { a: "Denied", b: "Denied" },
      response: "garbage=1",
    });
    const recoverResponse = getvaluefromError(result, {
      a: "Denied",
      b: "Denied",
    });
    expect(recoverResponse).toEqual({
      a: "Denied",
      b: "Denied",
    });
  });
});
