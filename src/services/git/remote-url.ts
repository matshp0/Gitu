const ERR_FAILED_PARSING = new Error("Could not parse remote url");

type ParsedUrlData = {
  protocol: "ssh" | "https";
  sshUser: string;
  host: string;
  owner: string;
  repo: string;
};

export interface RemoteUrlOptions {
  protocol: "ssh" | "https";
  sshUser?: string;
  host: string;
  owner: string;
  repo: string;
}

export class RemoteUrl {
  readonly protocol: "ssh" | "https";
  readonly sshUser: string;
  readonly host: string;
  readonly owner: string;
  readonly repo: string;

  constructor(url: string) {
    let parsedData: ParsedUrlData;

    if (url.startsWith("https://")) {
      parsedData = this.parseHttps(url);
    } else if (url.includes("@") && url.includes(":")) {
      parsedData = this.parseSsh(url);
    } else {
      throw ERR_FAILED_PARSING;
    }
    this.protocol = parsedData.protocol;
    this.sshUser = parsedData.sshUser;
    this.host = parsedData.host;
    this.owner = parsedData.owner;
    this.repo = parsedData.repo;
  }

  public static generateUrl(options: RemoteUrlOptions): string {
    const { protocol, sshUser, host, owner, repo } = options;
    if (protocol === "https") {
      return `https://${host}/${owner}/${repo}.git`;
    }
    if (protocol === "ssh") {
      const user = sshUser || "git";
      return `${user}@${host}:${owner}/${repo}.git`;
    }
    throw new Error("Unsupported protocol for URL generation");
  }

  private parseHttps(url: string): ParsedUrlData {
    const withoutProtocol = url.slice(8);

    const hostIdx = withoutProtocol.indexOf("/");
    if (hostIdx === -1) throw ERR_FAILED_PARSING;
    const host = withoutProtocol.slice(0, hostIdx);

    const withoutHost = withoutProtocol.slice(hostIdx + 1);
    const ownerIdx = withoutHost.indexOf("/");
    if (ownerIdx === -1) throw ERR_FAILED_PARSING;
    const owner = withoutHost.slice(0, ownerIdx);

    const withoutOwner = withoutHost.slice(ownerIdx + 1);
    const repo = withoutOwner.endsWith(".git")
      ? withoutOwner.slice(0, -4)
      : withoutOwner;

    return {
      protocol: "https",
      sshUser: "",
      host,
      owner,
      repo,
    };
  }

  private parseSsh(url: string): ParsedUrlData {
    const atIdx = url.indexOf("@");
    if (atIdx === -1) throw ERR_FAILED_PARSING;
    const sshUser = url.slice(0, atIdx);

    const colonIdx = url.indexOf(":", atIdx);
    if (colonIdx === -1) throw ERR_FAILED_PARSING;
    const host = url.slice(atIdx + 1, colonIdx);

    const withoutHost = url.slice(colonIdx + 1);
    const ownerIdx = withoutHost.indexOf("/");
    if (ownerIdx === -1) throw ERR_FAILED_PARSING;
    const owner = withoutHost.slice(0, ownerIdx);

    const withoutOwner = withoutHost.slice(ownerIdx + 1);
    const repo = withoutOwner.endsWith(".git")
      ? withoutOwner.slice(0, -4)
      : withoutOwner;

    return {
      protocol: "ssh",
      sshUser,
      host,
      owner,
      repo,
    };
  }
}
