/**
 * Git utilities for versioning integration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logWarn, logError } from '../error/ErrorLogger';

const execAsync = promisify(exec);

/**
 * Git information interface
 */
export interface GitInfo {
  /** Current branch name */
  branch: string;
  /** Current commit hash */
  commitHash: string;
  /** Short commit hash (8 characters) */
  shortHash: string;
  /** Commit message */
  commitMessage: string;
  /** Author name */
  author: string;
  /** Commit date */
  commitDate: string;
  /** Is working directory clean */
  isClean: boolean;
  /** Remote URL */
  remoteUrl: string | undefined;
}

/**
 * Git utilities class
 */
export class GitUtils {
  /**
   * Check if current directory is a git repository
   */
  static async isGitRepository(path: string): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: path });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get git information for current repository
   */
  static async getGitInfo(path: string): Promise<GitInfo | null> {
    try {
      if (!(await this.isGitRepository(path))) {
        return null;
      }

      const [
        branchResult,
        commitResult,
        messageResult,
        authorResult,
        dateResult,
        statusResult,
        remoteResult,
      ] = await Promise.allSettled([
        execAsync('git rev-parse --abbrev-ref HEAD', { cwd: path }),
        execAsync('git rev-parse HEAD', { cwd: path }),
        execAsync('git log -1 --pretty=%s', { cwd: path }),
        execAsync('git log -1 --pretty=%an', { cwd: path }),
        execAsync('git log -1 --pretty=%ci', { cwd: path }),
        execAsync('git status --porcelain', { cwd: path }),
        execAsync('git remote get-url origin', { cwd: path }).catch(() => ({ stdout: '' })),
      ]);

      const branch =
        branchResult.status === 'fulfilled' ? branchResult.value.stdout.trim() : 'unknown';
      const commitHash =
        commitResult.status === 'fulfilled' ? commitResult.value.stdout.trim() : 'unknown';
      const commitMessage =
        messageResult.status === 'fulfilled' ? messageResult.value.stdout.trim() : 'unknown';
      const author =
        authorResult.status === 'fulfilled' ? authorResult.value.stdout.trim() : 'unknown';
      const commitDate =
        dateResult.status === 'fulfilled' ? dateResult.value.stdout.trim() : 'unknown';
      const isClean =
        statusResult.status === 'fulfilled' ? statusResult.value.stdout.trim() === '' : true;
      const remoteUrl =
        remoteResult.status === 'fulfilled' ? remoteResult.value.stdout.trim() : undefined;

      return {
        branch,
        commitHash,
        shortHash: commitHash.substring(0, 8),
        commitMessage,
        author,
        commitDate,
        isClean,
        remoteUrl: remoteUrl || undefined,
      };
    } catch (error) {
      logError('Failed to get git information', error as Error, { path });
      return null;
    }
  }

  /**
   * Get current branch name
   */
  static async getCurrentBranch(path: string): Promise<string | null> {
    try {
      const result = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: path });
      return result.stdout.trim();
    } catch (error) {
      logWarn('Failed to get current branch', { error: (error as Error).message, path });
      return null;
    }
  }

  /**
   * Get current commit hash
   */
  static async getCurrentCommitHash(path: string): Promise<string | null> {
    try {
      const result = await execAsync('git rev-parse HEAD', { cwd: path });
      return result.stdout.trim();
    } catch (error) {
      logWarn('Failed to get current commit hash', { error: (error as Error).message, path });
      return null;
    }
  }

  /**
   * Get short commit hash (8 characters)
   */
  static async getShortCommitHash(path: string): Promise<string | null> {
    try {
      const result = await execAsync('git rev-parse --short=8 HEAD', { cwd: path });
      return result.stdout.trim();
    } catch (error) {
      logWarn('Failed to get short commit hash', { error: (error as Error).message, path });
      return null;
    }
  }

  /**
   * Check if working directory is clean
   */
  static async isWorkingDirectoryClean(path: string): Promise<boolean> {
    try {
      const result = await execAsync('git status --porcelain', { cwd: path });
      return result.stdout.trim() === '';
    } catch (error) {
      logWarn('Failed to check working directory status', {
        error: (error as Error).message,
        path,
      });
      return true; // Assume clean if we can't check
    }
  }

  /**
   * Get git tags
   */
  static async getTags(path: string): Promise<string[]> {
    try {
      const result = await execAsync('git tag --list', { cwd: path });
      return result.stdout
        .trim()
        .split('\n')
        .filter(tag => tag.length > 0);
    } catch (error) {
      logWarn('Failed to get git tags', { error: (error as Error).message, path });
      return [];
    }
  }

  /**
   * Get recent commits
   */
  static async getRecentCommits(
    path: string,
    count: number = 10
  ): Promise<
    Array<{
      hash: string;
      shortHash: string;
      message: string;
      author: string;
      date: string;
    }>
  > {
    try {
      const result = await execAsync(
        `git log --oneline --pretty=format:"%H|%h|%s|%an|%ci" -n ${count}`,
        { cwd: path }
      );

      return result.stdout
        .trim()
        .split('\n')
        .map(line => {
          const [hash, shortHash, message, author, date] = line.split('|');
          return {
            hash: hash || '',
            shortHash: shortHash || '',
            message: message || '',
            author: author || '',
            date: date || '',
          };
        });
    } catch (error) {
      logWarn('Failed to get recent commits', { error: (error as Error).message, path });
      return [];
    }
  }
}
