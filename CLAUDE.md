# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**gitu** is a CLI tool to manage multiple Git user profiles. It allows developers to create profiles with a name, email, and SSH key, then switch between them — automatically updating `git config user.name/email` and rewriting remote URLs to use the correct SSH host alias.

## Commands

This project uses **Bun** as the runtime. The CI pipeline uses **pnpm** with `build` and `test` scripts, but those scripts are not yet defined in `package.json`.

```bash
bun run src/index.ts        # Run CLI directly
bun install                 # Install dependencies
```

## Architecture

```
src/
├── index.ts              Entry point — sets up commander CLI
├── app/
│   ├── commands.ts       Registers CLI subcommands (add, use, remove, list, test)
│   ├── actions.ts        Command handlers; instantiates services and calls them
│   ├── prompts.ts        Interactive prompts (prompts library) for missing CLI options
│   └── types.ts          Shared app-level types
├── services/
│   ├── git/
│   │   ├── git-service.ts        Git config R/W and remote URL management via Bun shell ($``)
│   │   ├── git-exit-code.enum.ts Exit codes returned by git commands
│   │   └── remote-url.ts         Parses and generates SSH/HTTPS remote URLs
│   ├── profile/
│   │   └── profile-service.ts    Orchestrates profile CRUD; coordinates GitService + SshService
│   └── ssh/
│       └── ssh-service.ts        Reads/writes ~/.ssh/config Host blocks
└── libs/
    ├── constants.ts      Global constants (config key prefix "gitu", GitHub host/user)
    ├── files.ts          File I/O helpers
    └── string.ts         String utilities
```

### Key design decisions

- **Profile data is stored in global git config** under the `gitu.*` prefix (e.g. `gitu.work.email`).
- **SSH host aliases** follow the pattern `github-<profileName>` (e.g. `github-work`). When switching profiles, remote URLs are rewritten from `git@github.com:owner/repo.git` to `git@github-work:owner/repo.git`.
- **`ProfileService`** receives `GitService` and `SshService` via constructor injection.
- **`RemoteUrl`** handles both `ssh://` and standard SCP-style (`git@host:owner/repo`) formats.
- Shell commands run via Bun's `$` template tag (not Node's `child_process`).
