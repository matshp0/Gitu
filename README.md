# gitu

CLI tool to manage multiple Git user profiles. Create profiles with a name, email, and SSH key, then switch between them — automatically updating `git config user.name/email` and rewriting remote URLs to use the correct SSH host alias.

## Installation

```bash
bun install
```

## Usage

```bash
bun run src/index.ts <command>
```

## Commands

### `add`

Create a new profile. All options are prompted interactively if not provided.

```bash
gitu add
gitu add -n work -u johndoe -e john@work.com -f ~/.ssh/id_work
```

| Option | Description |
|---|---|
| `-n, --name <name>` | Profile name |
| `-u, --username <username>` | Git commit username |
| `-e, --email <email>` | Git commit email |
| `-f, --file <filepath>` | Path to SSH private key |

### `use [profile]`

Switch to a profile in the current repository — sets `user.name`/`user.email` and rewrites remote URLs to use the profile's SSH host alias. Uses the default profile if no argument is given.

```bash
gitu use work
gitu use        # uses default profile
```

### `default <profile>`

Set the default profile used by `gitu use` when no profile is specified.

```bash
gitu default work
```

### `list`

List all profiles, indicating which is current and which is the default.

```bash
gitu list
```

### `remove <profile>`

Remove a profile (prompts for confirmation).

```bash
gitu remove work
```

## How it works

- **Profile data** is stored in global git config under the `gitu.*` prefix (e.g. `gitu.work.email`).
- **SSH host aliases** follow the pattern `github-<profileName>` (e.g. `github-work`) and are written to `~/.ssh/config`. When switching profiles, remote URLs are rewritten from `git@github.com:owner/repo.git` to `git@github-work:owner/repo.git`.
