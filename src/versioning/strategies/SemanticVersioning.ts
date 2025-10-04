/**
 * Semantic Versioning Strategy
 * 
 * Implements semantic versioning (semver) standard for version management.
 * Follows the semantic versioning specification: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
 */

import { 
  VersionMetadata, 
  VersionComparison,
  SemanticVersionInfo
} from '../../types/versioning';
import { BaseVersioningStrategy } from './BaseVersioningStrategy';

/**
 * Semantic versioning strategy implementation
 * 
 * Supports:
 * - Basic semantic versions (MAJOR.MINOR.PATCH)
 * - Pre-release identifiers (alpha, beta, rc, etc.)
 * - Build identifiers
 * - Version comparison according to semver rules
 * - Version bumping (major, minor, patch, prerelease)
 */
export class SemanticVersioning extends BaseVersioningStrategy {
  private readonly SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  /**
   * Get the strategy name
   */
  getStrategyName(): string {
    return 'semantic';
  }

  /**
   * Validate if a version string is valid for semantic versioning
   */
  isValidVersion(version: string): boolean {
    if (!version || typeof version !== 'string') {
      return false;
    }

    return this.SEMVER_REGEX.test(version);
  }

  /**
   * Generate a semantic version from metadata
   */
  async generateVersion(metadata: VersionMetadata): Promise<string> {
    if (!this.validateMetadata(metadata)) {
      throw this.createError('Invalid metadata provided', 'INVALID_METADATA');
    }

    if (!metadata.semantic) {
      throw this.createError('Semantic version information is required', 'MISSING_SEMANTIC_INFO');
    }

    const { major, minor, patch, prerelease, build } = metadata.semantic;

    if (typeof major !== 'number' || typeof minor !== 'number' || typeof patch !== 'number') {
      throw this.createError('Major, minor, and patch must be numbers', 'INVALID_VERSION_COMPONENTS');
    }

    if (major < 0 || minor < 0 || patch < 0) {
      throw this.createError('Version components must be non-negative', 'NEGATIVE_VERSION_COMPONENTS');
    }

    let version = `${major}.${minor}.${patch}`;

    if (prerelease) {
      version += `-${prerelease}`;
    }

    if (build) {
      version += `+${build}`;
    }

    if (!this.isValidVersion(version)) {
      throw this.createError('Generated version is not valid', 'INVALID_GENERATED_VERSION');
    }

    return version;
  }

  /**
   * Parse a semantic version string to extract metadata
   */
  async parseVersion(version: string): Promise<VersionMetadata> {
    if (!this.isValidVersion(version)) {
      throw this.createError(`Invalid semantic version: ${version}`, 'INVALID_VERSION_FORMAT');
    }

    const match = version.match(this.SEMVER_REGEX);
    if (!match) {
      throw this.createError(`Failed to parse version: ${version}`, 'PARSE_ERROR');
    }

    const [, majorStr, minorStr, patchStr, prerelease, build] = match;
    
    const major = parseInt(majorStr!, 10);
    const minor = parseInt(minorStr!, 10);
    const patch = parseInt(patchStr!, 10);

    const semantic: SemanticVersionInfo = {
      major,
      minor,
      patch,
      full: version
    };

    if (prerelease) {
      semantic.prerelease = prerelease;
    }

    if (build) {
      semantic.build = build;
    }

    return {
      version,
      createdAt: this.generateTimestamp(),
      tags: [],
      semantic
    };
  }

  /**
   * Compare two semantic versions
   */
  async compareVersions(version1: string, version2: string): Promise<VersionComparison> {
    if (!this.isValidVersion(version1)) {
      throw this.createError(`Invalid version: ${version1}`, 'INVALID_VERSION_FORMAT');
    }

    if (!this.isValidVersion(version2)) {
      throw this.createError(`Invalid version: ${version2}`, 'INVALID_VERSION_FORMAT');
    }

    const v1Metadata = await this.parseVersion(version1);
    const v2Metadata = await this.parseVersion(version2);

    const v1 = v1Metadata.semantic!;
    const v2 = v2Metadata.semantic!;

    // Compare major, minor, patch
    const majorDiff = v1.major - v2.major;
    if (majorDiff !== 0) {
      return this.createComparisonResult(version1, version2, majorDiff > 0 ? 'greater' : 'less', majorDiff);
    }

    const minorDiff = v1.minor - v2.minor;
    if (minorDiff !== 0) {
      return this.createComparisonResult(version1, version2, minorDiff > 0 ? 'greater' : 'less', minorDiff);
    }

    const patchDiff = v1.patch - v2.patch;
    if (patchDiff !== 0) {
      return this.createComparisonResult(version1, version2, patchDiff > 0 ? 'greater' : 'less', patchDiff);
    }

    // Compare prerelease identifiers
    const prereleaseComparison = this.comparePrereleaseIdentifiers(v1.prerelease, v2.prerelease);
    if (prereleaseComparison !== 0) {
      return this.createComparisonResult(version1, version2, prereleaseComparison > 0 ? 'greater' : 'less', prereleaseComparison);
    }

    // Versions are equal (build identifiers don't affect precedence)
    return this.createComparisonResult(version1, version2, 'equal', 0);
  }

  /**
   * Bump version according to the specified type
   */
  async bumpVersion(
    metadata: VersionMetadata, 
    bumpType: 'major' | 'minor' | 'patch' | 'prerelease',
    prereleaseIdentifier?: string
  ): Promise<string> {
    if (!metadata.semantic) {
      throw this.createError('Semantic version information is required for bumping', 'MISSING_SEMANTIC_INFO');
    }

    const { major, minor, patch, prerelease, build } = metadata.semantic;
    let newMajor = major;
    let newMinor = minor;
    let newPatch = patch;
    let newPrerelease = prerelease;

    switch (bumpType) {
      case 'major':
        newMajor += 1;
        newMinor = 0;
        newPatch = 0;
        newPrerelease = undefined;
        break;
      case 'minor':
        newMinor += 1;
        newPatch = 0;
        newPrerelease = undefined;
        break;
      case 'patch':
        newPatch += 1;
        newPrerelease = undefined;
        break;
      case 'prerelease':
        newPatch += 1; // Prerelease bumps patch version
        if (prereleaseIdentifier) {
          newPrerelease = prereleaseIdentifier;
        } else if (prerelease) {
          // Increment existing prerelease
          newPrerelease = this.incrementPrereleaseIdentifier(prerelease);
        } else {
          newPrerelease = 'alpha';
        }
        break;
      default:
        throw this.createError(`Invalid bump type: ${bumpType}`, 'INVALID_BUMP_TYPE');
    }

    const bumpedMetadata: VersionMetadata = {
      ...metadata,
      semantic: {
        major: newMajor,
        minor: newMinor,
        patch: newPatch,
        full: '' // Will be generated
      }
    };

    if (newPrerelease) {
      bumpedMetadata.semantic!.prerelease = newPrerelease;
    }

    if (build) {
      bumpedMetadata.semantic!.build = build;
    }

    return this.generateVersion(bumpedMetadata);
  }

  /**
   * Compare prerelease identifiers according to semver rules
   */
  private comparePrereleaseIdentifiers(prerelease1?: string, prerelease2?: string): number {
    // If one has prerelease and the other doesn't, the one without prerelease is greater
    if (!prerelease1 && !prerelease2) return 0;
    if (!prerelease1 && prerelease2) return 1;
    if (prerelease1 && !prerelease2) return -1;

    const identifiers1 = prerelease1!.split('.');
    const identifiers2 = prerelease2!.split('.');

    const maxLength = Math.max(identifiers1.length, identifiers2.length);

    for (let i = 0; i < maxLength; i++) {
      const id1 = identifiers1[i];
      const id2 = identifiers2[i];

      // If one identifier is missing, the shorter one is less
      if (!id1 && !id2) continue;
      if (!id1 && id2) return -1;
      if (id1 && !id2) return 1;

      const comparison = this.comparePrereleaseIdentifier(id1!, id2!);
      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  }

  /**
   * Compare individual prerelease identifiers
   */
  private comparePrereleaseIdentifier(id1: string, id2: string): number {
    const isNumeric1 = /^\d+$/.test(id1);
    const isNumeric2 = /^\d+$/.test(id2);

    // Numeric identifiers have lower precedence than non-numeric
    if (isNumeric1 && !isNumeric2) return -1;
    if (!isNumeric1 && isNumeric2) return 1;

    if (isNumeric1 && isNumeric2) {
      const num1 = parseInt(id1, 10);
      const num2 = parseInt(id2, 10);
      return num1 - num2;
    }

    // String comparison for non-numeric identifiers
    return id1.localeCompare(id2);
  }

  /**
   * Increment prerelease identifier
   */
  private incrementPrereleaseIdentifier(prerelease: string): string {
    const identifiers = prerelease.split('.');
    const lastIdentifier = identifiers[identifiers.length - 1];

    if (/^\d+$/.test(lastIdentifier!)) {
      // If last identifier is numeric, increment it
      const num = parseInt(lastIdentifier!, 10);
      identifiers[identifiers.length - 1] = (num + 1).toString();
    } else {
      // If last identifier is not numeric, append .1
      identifiers.push('1');
    }

    return identifiers.join('.');
  }

  /**
   * Create comparison result
   */
  private createComparisonResult(
    version1: string, 
    version2: string, 
    result: 'greater' | 'less' | 'equal' | 'incompatible',
    difference: number
  ): VersionComparison {
    return {
      result,
      difference,
      details: this.generateComparisonDetails(version1, version2, result)
    };
  }
}
