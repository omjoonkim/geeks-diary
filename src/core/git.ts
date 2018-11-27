import { VcsAccount, VcsAuthenticationInfo, VcsCommitItem } from './vcs';


type Protocol = 'ssh' | 'https';


export interface GitRemoteUrl {
    readonly protocol: Protocol;

    /** The hostname of the remote. */
    readonly hostname: string;

    /**
     * The owner of the GitHub repository. This will be null if the URL doesn't
     * take the form of a GitHub repository URL (e.g., owner/name).
     */
    readonly owner: string | null;

    /**
     * The name of the GitHub repository. This will be null if the URL doesn't
     * take the form of a GitHub repository URL (e.g., owner/name).
     */
    readonly name: string | null;
}



// Examples:
// https://github.com/octocat/Hello-World.git
// https://github.com/octocat/Hello-World.git/
// git@github.com:octocat/Hello-World.git
// git:github.com/octocat/Hello-World.git
const gitRemoteRegexps: { protocol: Protocol; regex: RegExp }[] = [
    {
        protocol: 'https',
        regex: new RegExp('^https?://(?:.+@)?(.+)/(.+)/(.+?)(?:/|.git/?)?$'),
    },
    {
        protocol: 'ssh',
        regex: new RegExp('^git@(.+):(.+)/(.+?)(?:/|.git)?$'),
    },
    {
        protocol: 'ssh',
        regex: new RegExp('^git:(.+)/(.+)/(.+?)(?:/|.git)?$'),
    },
    {
        protocol: 'ssh',
        regex: new RegExp('^ssh://git@(.+)/(.+)/(.+?)(?:/|.git)?$'),
    },
];


/** Parse the remote information from URL. */
export function parseGitRemoteUrl(url: string): GitRemoteUrl | null {
    for (const { protocol, regex } of gitRemoteRegexps) {
        const result = url.match(regex);

        if (!result) {
            continue;
        }

        const hostname = result[1];
        const owner = result[2];
        const name = result[3];

        if (hostname) {
            return { protocol, hostname, owner, name };
        }
    }

    return null;
}


export enum GitErrorCodes {
    AUTHENTICATION_FAIL = 'AUTHENTICATION_FAIL',
}


/* tslint:disable */
/** A mapping from regexes to the git error they identify. */
export const gitErrorRegexes: {[key: string]: RegExp} = {
    [GitErrorCodes.AUTHENTICATION_FAIL]: /authentication required/,
};
/* tslint:enable */


export class GitError extends Error {
    readonly errorDescription: string;

    constructor(public readonly code: any) {
        super(getDescriptionForError(code));

        this.name = 'GitError';
        this.errorDescription = getDescriptionForError(code);
    }
}


function getDescriptionForError(code: GitErrorCodes): string {
    switch (code) {
        case GitErrorCodes.AUTHENTICATION_FAIL:
            return 'Authentication failed. Please check your credential.';

        default:
            return 'Unknown Error';
    }
}


export interface GitCloneOptions {
    url: string;
    localPath: string;
    authentication?: VcsAuthenticationInfo;
}


export interface GitCommitOptions {
    /** Workspace directory path. */
    workspaceDirPath: string;

    /** Commit message raw string. */
    message: string;

    /** List of files to add. Path must be relative to workspace directory path. */
    filesToAdd: string[];

    /** Author of commit. Same account will be sign to committer. */
    author: VcsAccount;

    /** When Commit is created. If not provided, current is default. */
     createdAt?: {
        time: number;
        offset: number;
    };
}


export interface GitGetHistoryOptions {
    /** Workspace directory path. */
    workspaceDirPath: string;

    /** The starting point to call up commits. If not provided, head commit is default. */
    commitId?: string;

    /** Size of history to call. */
    size: number;
}


export interface GitGetHistoryResult {
    /** Result of commit items. */
    history: VcsCommitItem[];

    /** Next request options. If all loaded, value will be null. */
    next: GitGetHistoryOptions | null;

    /** Previous request options. */
    previous: GitGetHistoryOptions;
}
