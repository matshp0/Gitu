import {
  CONFIG_DEFAULT_KEY,
  CONFIG_PROFILE_PREFIX,
  GITHUB_HOST,
  GITHUB_SSH_USER,
} from "../../libs/constants";
import { GitService } from "../git/git-service";
import { RemoteUrl } from "../git/remote-url";
import { SshService } from "../ssh/ssh-service";

interface Profile {
  name: string;
  username: string;
  email: string;
}

export class ProfileService {
  constructor(
    private readonly gitService: GitService,
    private readonly sshService: SshService,
  ) {}
  async getAllProfiles() {
    const userInfo = (await this.gitService.getConfigKeysByPrefix(
      [CONFIG_PROFILE_PREFIX],
      { global: true },
    )) as Record<string, Record<string, string> | string>;
    const profiles = Object.keys(userInfo)
      .filter((key) => {
        const entry = userInfo[key];
        return typeof entry === "object" && entry.username && entry.email;
      })
      .map((key) => {
        const entry = userInfo[key] as Record<string, string>;
        return { name: key, username: entry.username, email: entry.email };
      }) as Profile[];
    return profiles;
  }

  private getSshProfileName(name: string) {
    return `github-${name}`;
  }

  private async getProfile(profile: string) {
    const { username, email } = (await this.gitService.getConfigKeysByPrefix(
      [CONFIG_PROFILE_PREFIX, profile],
      { global: true },
    )) as Record<string, string>;
    if (!username || !email) {
      throw new Error(`Profile with name ${profile} does not exist`);
    }
    return { name: profile, username, email } as Profile;
  }

  private parseCloneTarget(url: string) {
    const shorthand = url.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (shorthand) {
      return { owner: shorthand[1]!, repo: shorthand[2]! };
    }
    const parsed = new RemoteUrl(url);
    return { owner: parsed.owner, repo: parsed.repo };
  }

  async addProfile(opts: Profile & { file: string }) {
    const { name, username, file, email } = opts;
    const profileName = this.getSshProfileName(name);
    this.sshService.addHost({
      name: profileName,
      host: GITHUB_HOST,
      identityFile: file,
      user: GITHUB_SSH_USER,
    });

    await this.gitService.setConfigKey(
      [CONFIG_PROFILE_PREFIX, name, "email"],
      email,
      { global: true },
    );
    await this.gitService.setConfigKey(
      [CONFIG_PROFILE_PREFIX, name, "username"],
      username,
      { global: true },
    );
  }

  async switchProfile(profile: string) {
    const { username, email } = await this.getProfile(profile);
    await this.gitService.setConfigKey(["user", "name"], username);
    await this.gitService.setConfigKey(["user", "email"], email);
    const remotes = await this.gitService.getRemoteUrl();
    if (!remotes) throw new Error("No remotes found");
    const newHost = this.getSshProfileName(profile);

    for (const [remoteName, remoteUrls] of Object.entries(remotes)) {
      if (!remoteUrls) continue;
      const { push, fetch } = remoteUrls;
      const buildNewUrl = (remoteData: {
        repo: string;
        owner: string;
        sshUser?: string;
      }) => {
        return RemoteUrl.generateUrl({
          repo: remoteData.repo,
          owner: remoteData.owner,
          host: newHost,
          protocol: "ssh",
          sshUser: remoteData.sshUser || "git",
        });
      };
      if (fetch) {
        const newUrl = buildNewUrl(fetch);
        await this.gitService.setRemoteUrl(remoteName, newUrl);
      }
      if (push) {
        const newUrl = buildNewUrl(push);
        await this.gitService.setRemoteUrl(remoteName, newUrl, true);
      }
    }
  }

  async resolveProfile(profile?: string) {
    if (profile) return profile;
    const defaultProfile = await this.getDefaultProfile();
    if (!defaultProfile) {
      throw new Error(
        "No profile specified and no default set. Use `gitu default <profile>` to set one.",
      );
    }
    return defaultProfile;
  }

  async cloneRepo(url: string, directory?: string, profile?: string) {
    const target = await this.resolveProfile(profile);
    const { username, email } = await this.getProfile(target);
    const { owner, repo } = this.parseCloneTarget(url);

    const cloneUrl = RemoteUrl.generateUrl({
      protocol: "ssh",
      sshUser: GITHUB_SSH_USER,
      host: this.getSshProfileName(target),
      owner,
      repo,
    });

    await this.gitService.clone(cloneUrl, directory);

    const cwd = directory ?? repo;
    await this.gitService.setConfigKey(["user", "name"], username, { cwd });
    await this.gitService.setConfigKey(["user", "email"], email, { cwd });

    return { profile: target, directory: cwd, url: cloneUrl };
  }

  async setDefaultProfile(name: string) {
    const profiles = await this.getAllProfiles();
    if (!profiles.find((p) => p.name === name)) {
      throw new Error(`Profile with name '${name}' does not exist`);
    }
    await this.gitService.setConfigKey(
      [CONFIG_PROFILE_PREFIX, CONFIG_DEFAULT_KEY],
      name,
      { global: true },
    );
  }

  async getDefaultProfile(): Promise<string | null> {
    const key = `${CONFIG_PROFILE_PREFIX}.${CONFIG_DEFAULT_KEY}`;
    const value = await this.gitService.getConfigKey(key, { global: true });
    return value ? value.trim() : null;
  }

  async getCurrentProfile(profiles: Profile[]): Promise<string | null> {
    let currentEmail = await this.gitService.getConfigKey("user.email");
    if (!currentEmail) {
      currentEmail = await this.gitService.getConfigKey("user.email", {
        global: true,
      });
    }
    if (!currentEmail) return null;
    const match = profiles.find((p) => p.email === currentEmail!.trim());
    return match?.name ?? null;
  }

  async removeProfile(name: string) {
    const sshProfileName = this.getSshProfileName(name);
    await this.sshService.removeByName(sshProfileName);
    await this.gitService.removeConfigKey(
      `${CONFIG_PROFILE_PREFIX}.${name}.username`,
      { global: true },
    );
    await this.gitService.removeConfigKey(
      `${CONFIG_PROFILE_PREFIX}.${name}.email`,
      { global: true },
    );
  }
}
