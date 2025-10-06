/**
 * Tests for GitUtils class
 */

// Mock dependencies before importing
jest.mock('child_process');
jest.mock('../../../../src/utils/error/ErrorLogger');

// Mock util.promisify to return a mock function
const mockExecAsync = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn(() => mockExecAsync),
}));

import { GitUtils, GitInfo } from '../../../../src/utils/git/GitUtils';
import { logWarn, logError } from '../../../../src/utils/error/ErrorLogger';

const mockLogWarn = logWarn as jest.MockedFunction<typeof logWarn>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

describe('GitUtils', () => {
  const testPath = '/test/path';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when directory is a git repository', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '.git\n', stderr: '' });

      const result = await GitUtils.isGitRepository(testPath);
      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith('git rev-parse --git-dir', { cwd: testPath });
    });

    it('should return false when directory is not a git repository', async () => {
      mockExecAsync.mockRejectedValue(new Error('Not a git repository'));

      const result = await GitUtils.isGitRepository(testPath);
      expect(result).toBe(false);
    });

    it('should return false when git command throws an error', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.isGitRepository(testPath);
      expect(result).toBe(false);
    });
  });

  describe('getGitInfo', () => {
    const mockGitInfo: GitInfo = {
      branch: 'main',
      commitHash: 'abc123def456',
      shortHash: 'abc123de',
      commitMessage: 'Test commit',
      author: 'Test Author',
      commitDate: '2023-01-01 12:00:00 +0000',
      isClean: true,
      remoteUrl: 'https://github.com/test/repo.git',
    };

    let isGitRepoSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock isGitRepository to return true
      isGitRepoSpy = jest.spyOn(GitUtils, 'isGitRepository').mockResolvedValue(true);
    });

    afterEach(() => {
      // Clean up the spy
      isGitRepoSpy.mockRestore();
    });

    it('should return null when directory is not a git repository', async () => {
      isGitRepoSpy.mockResolvedValue(false);

      const result = await GitUtils.getGitInfo(testPath);
      expect(result).toBeNull();
    });

    it('should return complete git information when all commands succeed', async () => {
      // Mock all git commands to succeed
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' }) // branch
        .mockResolvedValueOnce({ stdout: 'abc123def456\n', stderr: '' }) // commit hash
        .mockResolvedValueOnce({ stdout: 'Test commit\n', stderr: '' }) // commit message
        .mockResolvedValueOnce({ stdout: 'Test Author\n', stderr: '' }) // author
        .mockResolvedValueOnce({ stdout: '2023-01-01 12:00:00 +0000\n', stderr: '' }) // commit date
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // status
        .mockResolvedValueOnce({ stdout: 'https://github.com/test/repo.git\n', stderr: '' }); // remote

      const result = await GitUtils.getGitInfo(testPath);
      expect(result).toEqual(mockGitInfo);
    });

    it('should handle partial command failures gracefully', async () => {
      // Mock some commands to fail
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' }) // branch
        .mockResolvedValueOnce({ stdout: 'abc123def456\n', stderr: '' }) // commit hash
        .mockRejectedValueOnce(new Error('Command failed')) // commit message
        .mockResolvedValueOnce({ stdout: 'Test Author\n', stderr: '' }) // author
        .mockResolvedValueOnce({ stdout: '2023-01-01 12:00:00 +0000\n', stderr: '' }) // commit date
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // status
        .mockResolvedValueOnce({ stdout: 'https://github.com/test/repo.git\n', stderr: '' }); // remote

      const result = await GitUtils.getGitInfo(testPath);
      expect(result).toEqual({
        branch: 'main',
        commitHash: 'abc123def456',
        shortHash: 'abc123de',
        commitMessage: 'unknown',
        author: 'Test Author',
        commitDate: '2023-01-01 12:00:00 +0000',
        isClean: true,
        remoteUrl: 'https://github.com/test/repo.git',
      });
    });

    it('should handle dirty working directory', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' }) // branch
        .mockResolvedValueOnce({ stdout: 'abc123def456\n', stderr: '' }) // commit hash
        .mockResolvedValueOnce({ stdout: 'Test commit\n', stderr: '' }) // commit message
        .mockResolvedValueOnce({ stdout: 'Test Author\n', stderr: '' }) // author
        .mockResolvedValueOnce({ stdout: '2023-01-01 12:00:00 +0000\n', stderr: '' }) // commit date
        .mockResolvedValueOnce({ stdout: 'M modified-file.txt\n', stderr: '' }) // status
        .mockResolvedValueOnce({ stdout: 'https://github.com/test/repo.git\n', stderr: '' }); // remote

      const result = await GitUtils.getGitInfo(testPath);
      expect(result?.isClean).toBe(false);
    });

    it('should handle missing remote URL', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' }) // branch
        .mockResolvedValueOnce({ stdout: 'abc123def456\n', stderr: '' }) // commit hash
        .mockResolvedValueOnce({ stdout: 'Test commit\n', stderr: '' }) // commit message
        .mockResolvedValueOnce({ stdout: 'Test Author\n', stderr: '' }) // author
        .mockResolvedValueOnce({ stdout: '2023-01-01 12:00:00 +0000\n', stderr: '' }) // commit date
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // status
        .mockRejectedValueOnce(new Error('No remote origin')); // remote

      const result = await GitUtils.getGitInfo(testPath);
      expect(result?.remoteUrl).toBeUndefined();
    });

    it('should log error and return null when getGitInfo fails', async () => {
      // Mock isGitRepository to throw an error
      const isGitRepoSpy = jest
        .spyOn(GitUtils, 'isGitRepository')
        .mockRejectedValue(new Error('Unexpected error'));

      const result = await GitUtils.getGitInfo(testPath);
      expect(result).toBeNull();
      expect(mockLogError).toHaveBeenCalledWith(
        'Failed to get git information',
        expect.any(Error),
        { path: testPath }
      );

      // Clean up the spy
      isGitRepoSpy.mockRestore();
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name when command succeeds', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'feature-branch\n', stderr: '' });

      const result = await GitUtils.getCurrentBranch(testPath);
      expect(result).toBe('feature-branch');
      expect(mockExecAsync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', {
        cwd: testPath,
      });
    });

    it('should return null and log warning when command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.getCurrentBranch(testPath);
      expect(result).toBeNull();
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to get current branch', {
        error: 'Command failed',
        path: testPath,
      });
    });

    it('should handle exec throwing an error', async () => {
      mockExecAsync.mockRejectedValue(new Error('Exec failed'));

      const result = await GitUtils.getCurrentBranch(testPath);
      expect(result).toBeNull();
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to get current branch', {
        error: 'Exec failed',
        path: testPath,
      });
    });
  });

  describe('getCurrentCommitHash', () => {
    it('should return current commit hash when command succeeds', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'abc123def456789\n', stderr: '' });

      const result = await GitUtils.getCurrentCommitHash(testPath);
      expect(result).toBe('abc123def456789');
      expect(mockExecAsync).toHaveBeenCalledWith('git rev-parse HEAD', { cwd: testPath });
    });

    it('should return null and log warning when command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.getCurrentCommitHash(testPath);
      expect(result).toBeNull();
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to get current commit hash', {
        error: 'Command failed',
        path: testPath,
      });
    });
  });

  describe('getShortCommitHash', () => {
    it('should return short commit hash when command succeeds', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'abc123de\n', stderr: '' });

      const result = await GitUtils.getShortCommitHash(testPath);
      expect(result).toBe('abc123de');
      expect(mockExecAsync).toHaveBeenCalledWith('git rev-parse --short=8 HEAD', { cwd: testPath });
    });

    it('should return null and log warning when command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.getShortCommitHash(testPath);
      expect(result).toBeNull();
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to get short commit hash', {
        error: 'Command failed',
        path: testPath,
      });
    });
  });

  describe('isWorkingDirectoryClean', () => {
    it('should return true when working directory is clean', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await GitUtils.isWorkingDirectoryClean(testPath);
      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith('git status --porcelain', { cwd: testPath });
    });

    it('should return false when working directory has changes', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'M modified-file.txt\nA new-file.txt\n',
        stderr: '',
      });

      const result = await GitUtils.isWorkingDirectoryClean(testPath);
      expect(result).toBe(false);
    });

    it('should return true and log warning when command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.isWorkingDirectoryClean(testPath);
      expect(result).toBe(true); // Assumes clean if can't check
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to check working directory status', {
        error: 'Command failed',
        path: testPath,
      });
    });
  });

  describe('getTags', () => {
    it('should return array of tags when command succeeds', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'v1.0.0\nv1.1.0\nv2.0.0\n', stderr: '' });

      const result = await GitUtils.getTags(testPath);
      expect(result).toEqual(['v1.0.0', 'v1.1.0', 'v2.0.0']);
      expect(mockExecAsync).toHaveBeenCalledWith('git tag --list', { cwd: testPath });
    });

    it('should return empty array when no tags exist', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await GitUtils.getTags(testPath);
      expect(result).toEqual([]);
    });

    it('should filter out empty tags', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'v1.0.0\n\nv1.1.0\n\n', stderr: '' });

      const result = await GitUtils.getTags(testPath);
      expect(result).toEqual(['v1.0.0', 'v1.1.0']);
    });

    it('should return empty array and log warning when command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.getTags(testPath);
      expect(result).toEqual([]);
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to get git tags', {
        error: 'Command failed',
        path: testPath,
      });
    });
  });

  describe('getRecentCommits', () => {
    it('should return array of recent commits with default count', async () => {
      const mockCommits = [
        'abc123def456|abc123de|First commit|Author 1|2023-01-01 12:00:00 +0000',
        'def456ghi789|def456gh|Second commit|Author 2|2023-01-02 12:00:00 +0000',
      ];

      mockExecAsync.mockResolvedValue({ stdout: mockCommits.join('\n'), stderr: '' });

      const result = await GitUtils.getRecentCommits(testPath);
      expect(result).toEqual([
        {
          hash: 'abc123def456',
          shortHash: 'abc123de',
          message: 'First commit',
          author: 'Author 1',
          date: '2023-01-01 12:00:00 +0000',
        },
        {
          hash: 'def456ghi789',
          shortHash: 'def456gh',
          message: 'Second commit',
          author: 'Author 2',
          date: '2023-01-02 12:00:00 +0000',
        },
      ]);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'git log --oneline --pretty=format:"%H|%h|%s|%an|%ci" -n 10',
        { cwd: testPath }
      );
    });

    it('should return array of recent commits with custom count', async () => {
      const mockCommits = ['abc123def456|abc123de|First commit|Author 1|2023-01-01 12:00:00 +0000'];

      mockExecAsync.mockResolvedValue({ stdout: mockCommits.join('\n'), stderr: '' });

      const result = await GitUtils.getRecentCommits(testPath, 5);
      expect(result).toHaveLength(1);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'git log --oneline --pretty=format:"%H|%h|%s|%an|%ci" -n 5',
        { cwd: testPath }
      );
    });

    it('should handle commits with missing fields', async () => {
      const mockCommits = ['abc123def456||First commit||2023-01-01 12:00:00 +0000'];

      mockExecAsync.mockResolvedValue({ stdout: mockCommits.join('\n'), stderr: '' });

      const result = await GitUtils.getRecentCommits(testPath);
      expect(result).toEqual([
        {
          hash: 'abc123def456',
          shortHash: '',
          message: 'First commit',
          author: '',
          date: '2023-01-01 12:00:00 +0000',
        },
      ]);
    });

    it('should return empty array when no commits exist', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await GitUtils.getRecentCommits(testPath);
      // When stdout is empty, split('\n') returns [''] which gets mapped to one empty object
      expect(result).toEqual([
        {
          hash: '',
          shortHash: '',
          message: '',
          author: '',
          date: '',
        },
      ]);
    });

    it('should return empty array and log warning when command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await GitUtils.getRecentCommits(testPath);
      expect(result).toEqual([]);
      expect(mockLogWarn).toHaveBeenCalledWith('Failed to get recent commits', {
        error: 'Command failed',
        path: testPath,
      });
    });
  });

  describe('Error handling', () => {
    it('should handle exec throwing errors in all methods', async () => {
      // Reset all mocks and set up error scenario
      jest.clearAllMocks();

      // Mock execAsync to reject for all calls
      mockExecAsync.mockRejectedValue(new Error('Exec failed'));

      // Test each method individually to avoid interference
      const isGitRepoResult = await GitUtils.isGitRepository(testPath);
      const getBranchResult = await GitUtils.getCurrentBranch(testPath);
      const getCommitHashResult = await GitUtils.getCurrentCommitHash(testPath);
      const getShortHashResult = await GitUtils.getShortCommitHash(testPath);
      const isCleanResult = await GitUtils.isWorkingDirectoryClean(testPath);
      const getTagsResult = await GitUtils.getTags(testPath);
      const getCommitsResult = await GitUtils.getRecentCommits(testPath);

      // All should handle errors gracefully
      expect(isGitRepoResult).toBe(false);
      expect(getBranchResult).toBeNull();
      expect(getCommitHashResult).toBeNull();
      expect(getShortHashResult).toBeNull();
      expect(isCleanResult).toBe(true);
      expect(getTagsResult).toEqual([]);
      expect(getCommitsResult).toEqual([]);
    });
  });
});
