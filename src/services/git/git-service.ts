import { $ } from "bun";
import { CONFIG_PROFILE_PREFIX } from "../../libs/constants";
import { createPrefixRegex } from "../../libs/string";
import { GitExitCode } from "./git-exit-code.enum";
import { RemoteUrl } from "./remote-url";

interface ConfigOptions {
  global: boolean;
}

const ERR_INVALID_KEY = new Error("Invalid Git key");
const ERR_NOT_GIT_REPOSITORY = new Error("Not a git repository");
const ERR_PARSE_FAILED = new Error("Can't parse the output of git command");

export class GitService {
  readonly prefix: string = CONFIG_PROFILE_PREFIX;
  constructor() {}

  private isValidKey(key: string) {
    const gitKeyRegex = /^[a-zA-Z0-9-]+\.(?:[a-zA-Z0-9-]+\.)?[a-zA-Z0-9-]+$/;
    return gitKeyRegex.test(key);
  }

  private extractKeys(text: string, prefix: string) {
    const trimmed = text.trim();
    const entries = trimmed.split("\n");
    let result = {};
    entries.forEach((entry) => {
      const withoutPrefix = entry.slice(prefix.length);
      const [key, value] = withoutPrefix.split(" ");
      if (key === undefined || value === undefined) return;
      const keyParts = key.split(".");
      let obj: any = result;
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i]!;
        const newObj = obj[part] ? obj[part] : {};
        obj[part] = newObj;
        obj = newObj;
      }
      obj[keyParts[keyParts.length - 1]!] = value;
    });
    return result;
  }

  getPrefixedKey(key: string) {
    return `${this.prefix}.${key}`;
  }

  private parseGitRemoteOutput(str: string) {
    const trimmed = str.trim();
    if (trimmed === "") return null;
    const parts = trimmed.split(/\s+/);
    if (parts.length % 3 !== 0) throw ERR_PARSE_FAILED;
    const res: any = {};
    for (let i = 0; i < parts.length; i += 3) {
      const segment = parts.slice(i, i + 3);
      const [name, url, rawAction] = segment as [string, string, string];
      const action = rawAction.slice(1, rawAction.length - 1);
      res[name] ??= {};
      res[name][action] = new RemoteUrl(url);
    }
    return res;
  }

  async setConfigKey(
    prefixes: string[],
    value: string,
    options?: ConfigOptions,
  ) {
    const key = prefixes.join(".");
    if (!this.isValidKey(key)) throw ERR_INVALID_KEY;
    const locality = options?.global ? "global" : "local";
    const proc = $`git config --${locality} ${key} ${value}`.quiet();
    await proc.nothrow();
  }

  async getConfigKeysByPrefix(prefixes: string[], options?: ConfigOptions) {
    const prefix = prefixes.join(".") + ".";
    const regEx = createPrefixRegex(prefix);
    const locality = options?.global ? "global" : "local";
    const proc =
      $`git config --${locality} --get-regexp ${regEx.source}`.quiet();
    const res = await proc.nothrow();
    const text = res.text();
    const keys = this.extractKeys(text, prefix) as
      | Record<string, Record<string, string>>
      | Record<string, string>;
    return keys;
  }

  async getConfigKey(key: string, options?: ConfigOptions) {
    if (!this.isValidKey(key)) throw ERR_INVALID_KEY;
    const locality = options?.global ? "global" : "local";
    const proc = $`git config --${locality} --get ${key}`.quiet();
    const res = await proc.nothrow();
    if (res.exitCode !== GitExitCode.SUCCESS) return null;
    return res.text();
  }

  async getRemoteUrl(): Promise<Record<
    string,
    { fetch?: RemoteUrl; push?: RemoteUrl }
  > | null> {
    const proc = $`git remote -v`.quiet();
    const res = await proc.nothrow();
    if (res.exitCode === GitExitCode.FATAL) throw ERR_NOT_GIT_REPOSITORY;
    const text = res.text();
    return this.parseGitRemoteOutput(text);
  }

  async setRemoteUrl(remote: string, url: string, isPush?: boolean) {
    const args = ["remote", "set-url"];
    if (isPush) args.push("--push");
    args.push(remote, url);
    const proc = $`git ${args}`.quiet();
    const res = await proc.nothrow();
    if (res.exitCode === GitExitCode.FATAL) throw ERR_NOT_GIT_REPOSITORY;
    const text = res.text();
    return this.parseGitRemoteOutput(text);
  }

  async removeConfigKey(key: string, options?: ConfigOptions) {
    if (!this.isValidKey(key)) throw ERR_INVALID_KEY;
    const locality = options?.global ? "global" : "local";
    const proc = $`git config --${locality} --unset ${key}`.quiet();
    await proc.nothrow();
  }
}
