import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { z } from "zod/v4";

const DEFAULT_REGISTRY_PATH = join(homedir(), ".config", "aeira", "vaults.json");

const vaultSchema = z.object({
  name: z.string(),
  path: z.string(),
});

type Vault = z.infer<typeof vaultSchema>;

export function loadVaults(registryPath = DEFAULT_REGISTRY_PATH): Vault[] {
  if (!existsSync(registryPath)) {
    return [];
  }
  const content = readFileSync(registryPath, "utf-8");
  return z.array(vaultSchema).parse(JSON.parse(content));
}

function saveVaults(vaults: Vault[], registryPath = DEFAULT_REGISTRY_PATH): void {
  const directory = dirname(registryPath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  writeFileSync(registryPath, JSON.stringify(vaults, null, 2), "utf-8");
}

export function addVault(name: string, path: string, registryPath = DEFAULT_REGISTRY_PATH): void {
  const vaults = loadVaults(registryPath);
  if (vaults.some((vault) => vault.name === name)) {
    throw new Error(`Vault already exists: ${name}`);
  }
  vaults.push({ name, path: resolve(path) });
  saveVaults(vaults, registryPath);
}

export function removeVault(name: string, registryPath = DEFAULT_REGISTRY_PATH): void {
  const vaults = loadVaults(registryPath);
  if (!vaults.some((vault) => vault.name === name)) {
    throw new Error(`Vault not found: ${name}`);
  }
  saveVaults(
    vaults.filter((vault) => vault.name !== name),
    registryPath,
  );
}

export function renameVault(
  oldName: string,
  newName: string,
  registryPath = DEFAULT_REGISTRY_PATH,
): void {
  const vaults = loadVaults(registryPath);
  if (!vaults.some((vault) => vault.name === oldName)) {
    throw new Error(`Vault not found: ${oldName}`);
  }
  if (vaults.some((vault) => vault.name === newName)) {
    throw new Error(`Vault already exists: ${newName}`);
  }
  saveVaults(
    vaults.map((vault) => (vault.name === oldName ? { ...vault, name: newName } : vault)),
    registryPath,
  );
}

export function resolveVault(path: string, registryPath = DEFAULT_REGISTRY_PATH): Vault {
  const resolvedPath = resolve(path);
  const vaults = loadVaults(registryPath);
  const matches = vaults.filter(
    (vault) => resolvedPath === vault.path || resolvedPath.startsWith(`${vault.path}/`),
  );

  if (matches.length === 0) {
    throw new Error(
      `No vault found for path: ${resolvedPath}\nRun 'aeira init <path> <name>' first.`,
    );
  }

  matches.sort((a, b) => a.path.length - b.path.length);
  return matches[0];
}
