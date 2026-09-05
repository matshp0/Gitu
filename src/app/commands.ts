import type { Command } from "commander";
import {
  addProfile,
  cloneRepo,
  listProfiles,
  useProfile,
  test,
  removeProfile,
  setDefaultProfile,
} from "./actions";

export const register = (cli: Command) => {
  cli
    .command("add")
    .description("Say hello")
    .option("-n, --name <name>", "name of profile")
    .option("-u, --username <username>", "username used to commit")
    .option("-e, --email <email>", "email used to commit")
    .option("-f, --file <filepath>", "ssh private key")
    .action(addProfile);

  cli
    .command("use")
    .description("Change current profile (uses default if no profile given)")
    .argument("[profile]", "profile to switch to")
    .action(useProfile);

  cli
    .command("clone")
    .description(
      "Clone a repository using a profile's ssh key (uses default if no profile given)",
    )
    .argument("<url>", "repository url or owner/repo")
    .argument("[directory]", "directory to clone into")
    .option("-p, --profile <profile>", "profile to clone with")
    .action(cloneRepo);

  cli
    .command("default")
    .description("Set the default profile")
    .argument("<profile>", "profile to set as default")
    .action(setDefaultProfile);

  cli
    .command("remove")
    .description("Remove profile by name")
    .argument("<profile>", "profile to remove")
    .action(removeProfile);

  cli.command("list").description("List all profiles").action(listProfiles);
  cli.command("test").description("List all profiles").action(test);
};
