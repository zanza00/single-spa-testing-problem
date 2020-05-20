import { calculateAuthState } from "./permissionContextFactory";

describe("It display the correct permission", () => {
  it("return granted", () => {
    const value = {
      a: "Granted",
      b: "Denied",
      c: "Denied",
    } as const;
    const roles = ["a"];
    const result = calculateAuthState(value, roles);
    expect(result).toBe("Granted");
  });
  it("return Denied", () => {
    const value = {
      a: "Granted",
      b: "Denied",
      c: "Denied",
    } as const;
    const roles = ["b"];
    const result = calculateAuthState(value, roles);
    expect(result).toBe("Denied");
  });
  it("return Loading", () => {
    const value = {
      a: "Loading",
      b: "Loading",
      c: "Loading",
    } as const;
    const roles = ["b"];
    const result = calculateAuthState(value, roles);
    expect(result).toBe("Loading");
  });
});
