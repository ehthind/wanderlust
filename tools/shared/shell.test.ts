import { describe, expect, it } from "vitest";

import { resolveShell, resolveShellArgs } from "./shell.mjs";

describe("resolveShell", () => {
  it("prefers SHELL on non-Windows platforms", () => {
    expect(resolveShell({ SHELL: "/usr/bin/zsh" })).toBe("/usr/bin/zsh");
  });

  it("falls back to bash when SHELL is unset on non-Windows platforms", () => {
    expect(resolveShell({})).toBe("/bin/bash");
  });
});

describe("resolveShellArgs", () => {
  it("uses login shell arguments on non-Windows platforms", () => {
    expect(resolveShellArgs("echo ok")).toEqual(["-lc", "echo ok"]);
  });
});
