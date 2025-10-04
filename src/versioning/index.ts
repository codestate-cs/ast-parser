// Versioning system exports
export { VersionManager } from './VersionManager';
export { BaseVersioningStrategy } from './strategies/BaseVersioningStrategy';
export { BranchVersioning } from './strategies/BranchVersioning';
export { TimestampVersioning } from './strategies/TimestampVersioning';
export { CustomVersioning } from './strategies/CustomVersioning';
export { SemanticVersioning } from './strategies/SemanticVersioning';
export { VersionComparator } from './comparison/VersionComparator';
export { DiffGenerator } from './comparison/DiffGenerator';
export { ChangeDetector } from './comparison/ChangeDetector';

// Re-export types
export * from '../types/versioning';
