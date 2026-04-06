import { appendFile, readFile, writeFile } from "node:fs/promises";
import { expandPath, fileExists } from "../../libs/files";
import { homedir } from "node:os";
import { join } from "node:path";

interface AddHostOptions {
  name: string;
  user: string;
  host: string;
  identityFile: string;
}

export class SshService {
  private readonly configPath: string;
  constructor() {
    const sshDir = join(homedir(), ".ssh");
    const configPath = join(sshDir, "config");
    this.configPath = configPath;
  }

  private getConfigBlock({ identityFile, name, user, host }: AddHostOptions) {
    return `
Host ${name}
  HostName ${host}
  User ${user}
  IdentityFile ${identityFile}
  IdentitiesOnly yes
`;
  }

  async addHost(opts: AddHostOptions) {
    const { identityFile } = opts;
    const identityFilePath = expandPath(identityFile);
    if (!(await fileExists(identityFilePath)))
      throw new Error(`File ${identityFile} does not exist`);
    const configStr = "\n" + this.getConfigBlock(opts);
    await appendFile(this.configPath, configStr, { mode: 0o600 });
  }

  async removeByName(name: string) {
    if (!(await fileExists(this.configPath))) {
      return;
    }
    const content = await readFile(this.configPath, "utf-8");
    const lines = content.split("\n");
    const resultLines: string[] = [];
    let isSkipping = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("Host ") || trimmedLine.startsWith("Match ")) {
        if (trimmedLine === `Host ${name}`) {
          isSkipping = true;
          continue;
        } else {
          isSkipping = false;
        }
      }
      if (!isSkipping) {
        resultLines.push(line);
      }
    }
    const finalContent = resultLines.join("\n").trim() + "\n";
    await writeFile(this.configPath, finalContent, { mode: 0o600 });
  }
}
