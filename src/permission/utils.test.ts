import * as t from "io-ts";
import { mapCodecTo } from "./utils";

describe("get a value from Codec", () => {
  it("can ouput a value", () => {
    const result = mapCodecTo(t.type({ a: t.boolean, b: t.boolean }), "Denied");

    expect(result).toEqual({ a: "Denied", b: "Denied" });
  });
});
