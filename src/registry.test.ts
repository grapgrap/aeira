import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addVault, loadVaults, resolveVault } from "./registry";

describe("registry", () => {
  let registryPath: string;
  let tempDirectory: string;

  beforeEach(() => {
    tempDirectory = join(tmpdir(), `aeira-test-${Date.now()}`);
    mkdirSync(tempDirectory, { recursive: true });
    registryPath = join(tempDirectory, "vaults.json");
  });

  afterEach(() => {
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  describe("loadVaults", () => {
    it("returns empty array when registry file does not exist", () => {
      expect(loadVaults(registryPath)).toEqual([]);
    });
  });

  describe("addVault", () => {
    it("adds a vault to the registry", () => {
      addVault("my-vault", "/workspace/vault", registryPath);

      const vaults = loadVaults(registryPath);
      expect(vaults).toHaveLength(1);
      expect(vaults[0]).toEqual({ name: "my-vault", path: "/workspace/vault" });
    });

    it("throws when adding a vault with duplicate name", () => {
      addVault("my-vault", "/workspace/vault-a", registryPath);

      expect(() => addVault("my-vault", "/workspace/vault-b", registryPath)).toThrow(
        "Vault already exists: my-vault",
      );
    });
  });

  describe("resolveVault", () => {
    it("resolves exact path match", () => {
      addVault("my-vault", "/workspace/vault", registryPath);

      const result = resolveVault("/workspace/vault", registryPath);
      expect(result.name).toBe("my-vault");
    });

    it("resolves when path is inside a vault", () => {
      addVault("my-vault", "/workspace/vault", registryPath);

      const result = resolveVault("/workspace/vault/docs/readme.md", registryPath);
      expect(result.name).toBe("my-vault");
    });

    it("selects the shortest path vault when multiple vaults match", () => {
      addVault("root-vault", "/workspace/project", registryPath);
      addVault("nested-vault", "/workspace/project/.loom", registryPath);

      const result = resolveVault("/workspace/project/.loom/concepts", registryPath);
      expect(result.name).toBe("root-vault");
    });

    it("throws when no vault matches the path", () => {
      addVault("my-vault", "/workspace/vault", registryPath);

      expect(() => resolveVault("/other/path", registryPath)).toThrow("No vault found for path");
    });

    it("does not match vault path that is a prefix of a directory name", () => {
      addVault("my-vault", "/workspace/foo", registryPath);

      expect(() => resolveVault("/workspace/foobar", registryPath)).toThrow(
        "No vault found for path",
      );
    });
  });
});
