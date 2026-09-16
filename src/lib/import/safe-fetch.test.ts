import { describe, expect, it } from "vitest";

import { assertPublicUrl, UnsafeUrlError } from "@/lib/import/safe-fetch";

describe("assertPublicUrl", () => {
  it.each([
    "http://127.0.0.1/",
    "http://10.0.0.5/admin",
    "http://192.168.1.1/",
    "http://172.20.0.1/",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[::ffff:a00:1]/",
    "http://[64:ff9b::a9fe:a9fe]/",
    "http://[fd00::1]/",
    "http://0.0.0.0/",
    "file:///etc/passwd",
    "ftp://example.com/",
    "https://user:pass@example.com/",
    "não é url",
  ])("bloqueia %s", async (url) => {
    await expect(assertPublicUrl(url)).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("aceita IP público", async () => {
    await expect(assertPublicUrl("https://8.8.8.8/")).resolves.toBeInstanceOf(URL);
    await expect(assertPublicUrl("https://[::ffff:808:808]/")).resolves.toBeInstanceOf(URL);
    await expect(assertPublicUrl("https://[2606:4700::1111]/")).resolves.toBeInstanceOf(URL);
  });
});
