import type { AddProfileOptions } from "./types";
import { addProfilePrompts, confirmRemoveProfile } from "./prompts";
import { GitService } from "../services/git/git-service";
import { ProfileService } from "../services/profile/profile-service";
import { SshService } from "../services/ssh/ssh-service";

const gitService = new GitService();
const sshService = new SshService();
const profileService = new ProfileService(gitService, sshService);

export const addProfile = async (options: AddProfileOptions) => {
  const data = await addProfilePrompts(options);
  await profileService.addProfile(data);
  console.log(`Profile '${data.name}' was successfuly added`);
};

export const useProfile = async (profile?: string) => {
  try {
    let target = profile;
    if (!target) {
      const defaultProfile = await profileService.getDefaultProfile();
      if (!defaultProfile) {
        console.log(
          "Error: No profile specified and no default set. Use `gitu default <profile>` to set one.",
        );
        return;
      }
      target = defaultProfile;
    }
    await profileService.switchProfile(target);
    console.log(`Switched to profile: ${target}`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error: ${err.message}`);
    }
  }
};

export const setDefaultProfile = async (profile: string) => {
  try {
    await profileService.setDefaultProfile(profile);
    console.log(`Default profile set to: ${profile}`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error: ${err.message}`);
    }
  }
};

export const listProfiles = async () => {
  const profiles = await profileService.getAllProfiles();
  const [currentProfile, defaultProfile] = await Promise.all([
    profileService.getCurrentProfile(profiles),
    profileService.getDefaultProfile(),
  ]);

  console.log(`Profiles (${profiles.length}):\n`);

  profiles.forEach((profile, index) => {
    const tags: string[] = [];
    if (profile.name === currentProfile) tags.push("current");
    if (profile.name === defaultProfile) tags.push("default");
    const suffix = tags.length ? ` (${tags.join(", ")})` : "";
    console.log(`${index + 1}. ${profile.name}${suffix}`);
    console.log(`   username: ${profile.username}`);
    console.log(`   email:    ${profile.email}\n`);
  });
};

export const removeProfile = async (profile: string) => {
  try {
    const profiles = await profileService.getAllProfiles();
    if (!profiles.find((p) => p.name === profile)) {
      console.log(`Error: Profile '${profile}' does not exist`);
      return;
    }
    const confirmed = await confirmRemoveProfile(profile);
    if (!confirmed) {
      console.log("Aborted.");
      return;
    }
    await profileService.removeProfile(profile);
    console.log(`Profile '${profile}' was successfully removed`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error: ${err.message}`);
    }
  }
};

export const test = async () => {
  const res = await gitService.getRemoteUrl();
  console.dir({ res }, { depth: null });
};
