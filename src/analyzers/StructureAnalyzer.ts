import {
  ProjectInfo,
  ProjectStructureAnalysis,
  ProjectPattern,
  ProjectArchitecture,
  ArchitectureLayer,
  ArchitectureModule,
} from '../types';
import { StructureAnalysisOptions } from '../types/options';
import { InvalidInputError } from '../utils/error';

interface DirectoryInfo {
  name: string;
  path: string;
  depth?: number;
}

interface FileInfo {
  name: string;
  path: string;
  lines?: number;
  size?: number;
}

interface ProjectStructure {
  directories: DirectoryInfo[];
  files: FileInfo[];
  totalFiles: number;
  totalLines: number;
  totalSize: number;
}

/**
 * Structure analysis result
 */
export interface StructureAnalysisOutput {
  structureAnalysis: ProjectStructureAnalysis;
  fileStats?: {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    averageFileSize: number;
    averageLinesPerFile: number;
  };
  directoryStats?: {
    totalDirectories: number;
    maxDepth: number;
    averageDepth: number;
    directoriesByDepth: Record<number, number>;
  };
}

/**
 * StructureAnalyzer class
 * This analyzer analyzes project structure, organization patterns,
 * architecture, and provides structural metrics.
 */
export class StructureAnalyzer {
  /**
   * Analyze project structure
   */
  public analyze(
    projectInfo: ProjectInfo,
    options?: StructureAnalysisOptions
  ): StructureAnalysisOutput {
    this.validateInput(projectInfo);

    const resolvedOptions: Required<StructureAnalysisOptions> = {
      includePatterns: [],
      excludePatterns: [],
      analyzeDepth: true,
      analyzeBreadth: true,
      analyzeOrganization: true,
      analyzePatterns: true,
      analyzeArchitecture: true,
      maxDepth: 10,
      includeFileStats: false,
      includeDirectoryStats: false,
      ...options,
    };

    const structure = projectInfo.structure ?? {
      directories: [],
      files: [],
      totalFiles: 0,
      totalLines: 0,
      totalSize: 0,
    };

    const filteredStructure = this.filterStructure(structure, resolvedOptions);

    const structureAnalysis: ProjectStructureAnalysis = {
      depth: resolvedOptions.analyzeDepth ? this.calculateDepth(filteredStructure) : 0,
      breadth: resolvedOptions.analyzeBreadth ? this.calculateBreadth(filteredStructure) : 0,
      organization: resolvedOptions.analyzeOrganization
        ? this.detectOrganization(filteredStructure)
        : 'flat',
      patterns: resolvedOptions.analyzePatterns ? this.detectPatterns(filteredStructure) : [],
      architecture: resolvedOptions.analyzeArchitecture
        ? this.analyzeArchitecture(filteredStructure)
        : {
            type: 'monolithic',
            description: 'Monolithic architecture',
            layers: [],
            modules: [],
            dependencies: [],
          },
    };

    const result: StructureAnalysisOutput = {
      structureAnalysis,
    };

    if (resolvedOptions.includeFileStats) {
      result.fileStats = this.calculateFileStats(filteredStructure);
    }

    if (resolvedOptions.includeDirectoryStats) {
      result.directoryStats = this.calculateDirectoryStats(filteredStructure);
    }

    return result;
  }

  /**
   * Validate input
   */
  private validateInput(projectInfo: ProjectInfo): void {
    if (!projectInfo) {
      throw new InvalidInputError('Project info is required');
    }

    if (!projectInfo.rootPath) {
      throw new InvalidInputError('Project root path is required');
    }
  }

  /**
   * Filter structure based on include/exclude patterns
   */
  private filterStructure(
    structure: ProjectStructure,
    options: Required<StructureAnalysisOptions>
  ): ProjectStructure {
    let filteredDirectories = structure.directories ?? [];
    const filteredFiles = structure.files ?? [];

    // Filter directories by maxDepth (only if explicitly set)
    if (options.maxDepth !== undefined && options.maxDepth !== 10) {
      filteredDirectories = filteredDirectories.filter((dir: DirectoryInfo) => {
        let depth: number;
        if (dir.depth !== undefined) {
          depth = dir.depth;
        } else {
          // Calculate depth from path by counting directory separators
          depth = (dir.path ?? '').split('/').length - 1;
        }
        return depth <= options.maxDepth;
      });
    }

    return {
      directories: filteredDirectories,
      files: filteredFiles,
      totalFiles: structure.totalFiles ?? 0,
      totalLines: structure.totalLines ?? 0,
      totalSize: structure.totalSize ?? 0,
    };
  }

  /**
   * Calculate project depth
   */
  private calculateDepth(structure: ProjectStructure): number {
    const directories = structure.directories ?? [];
    if (directories.length === 0) {
      return 0;
    }

    return Math.max(
      ...directories.map((dir: DirectoryInfo) => {
        // Use depth property if available, otherwise calculate from path
        if (dir.depth !== undefined) {
          return Math.max(0, dir.depth);
        }
        // Calculate depth from path by counting directory separators
        const pathDepth = (dir.path ?? '').split('/').length - 1;
        return Math.max(0, pathDepth);
      })
    );
  }

  /**
   * Calculate project breadth (max directories at any single depth)
   */
  private calculateBreadth(structure: ProjectStructure): number {
    const directories = structure.directories ?? [];
    if (directories.length === 0) {
      return 0;
    }

    // Deduplicate directories by path
    const uniqueDirectories = new Map<string, DirectoryInfo>();
    directories.forEach((dir: DirectoryInfo) => {
      if (dir.path && !uniqueDirectories.has(dir.path)) {
        uniqueDirectories.set(dir.path, dir);
      }
    });

    const depthCounts: Record<number, number> = {};
    uniqueDirectories.forEach((dir: DirectoryInfo) => {
      let depth: number;
      if (dir.depth !== undefined) {
        depth = Math.max(0, dir.depth);
      } else {
        // Calculate depth from path by counting directory separators
        depth = Math.max(0, (dir.path ?? '').split('/').length - 1);
      }
      depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;
    });

    return Math.max(...Object.values(depthCounts));
  }

  /**
   * Detect project organization pattern
   */
  private detectOrganization(
    structure: ProjectStructure
  ): 'flat' | 'nested' | 'modular' | 'monorepo' {
    const directories = structure.directories ?? [];
    if (directories.length === 0) {
      return 'flat';
    }

    const maxDepth = this.calculateDepth(structure);

    // Check for monorepo pattern (apps/, packages/, tools/ at root level)
    const rootLevelDirs = directories.filter((dir: DirectoryInfo) => {
      const depth = dir.depth ?? Math.max(0, (dir.path ?? '').split('/').length - 1);
      return depth === 1;
    });
    const rootLevelNames = rootLevelDirs.map((dir: DirectoryInfo) => dir.name ?? '');

    if (rootLevelNames.includes('apps') && rootLevelNames.includes('packages')) {
      return 'monorepo';
    }

    // Check for modular pattern (packages/ with subdirectories)
    if (rootLevelNames.includes('packages')) {
      const packagesDir = rootLevelDirs.find((dir: DirectoryInfo) => dir.name === 'packages');
      if (packagesDir) {
        const packageSubdirs = directories.filter((dir: DirectoryInfo) => {
          const depth = dir.depth ?? Math.max(0, (dir.path ?? '').split('/').length - 1);
          return dir.path?.startsWith(`${packagesDir.path}/`) && depth === 2;
        });
        if (packageSubdirs.length > 1) {
          return 'modular';
        }
      }
    }

    // Check for nested pattern (deep hierarchy)
    if (maxDepth > 3) {
      return 'nested';
    }

    // Default to flat
    return 'flat';
  }

  /**
   * Detect project patterns
   */
  private detectPatterns(structure: ProjectStructure): ProjectPattern[] {
    const directories = structure.directories ?? [];
    const patterns: ProjectPattern[] = [];

    // Common patterns
    const commonPatterns = [
      {
        name: 'components',
        type: 'structural' as const,
        description: 'Component-based architecture',
      },
      { name: 'hooks', type: 'structural' as const, description: 'Custom hooks pattern' },
      { name: 'utils', type: 'structural' as const, description: 'Utility functions' },
      { name: 'services', type: 'structural' as const, description: 'Service layer pattern' },
      { name: 'types', type: 'structural' as const, description: 'Type definitions' },
      {
        name: 'constants',
        type: 'structural' as const,
        description: 'Constants and configuration',
      },
      { name: 'assets', type: 'structural' as const, description: 'Static assets' },
      { name: 'styles', type: 'structural' as const, description: 'Styling files' },
      { name: 'tests', type: 'structural' as const, description: 'Test files' },
      { name: 'docs', type: 'structural' as const, description: 'Documentation' },
    ];

    commonPatterns.forEach(pattern => {
      const matchingDirs = directories.filter((dir: DirectoryInfo) =>
        dir.name?.toLowerCase().includes(pattern.name.toLowerCase())
      );

      if (matchingDirs.length > 0) {
        patterns.push({
          name: pattern.name,
          type: pattern.type,
          description: pattern.description,
          confidence: Math.min(100, matchingDirs.length * 20),
          examples: matchingDirs.map((dir: DirectoryInfo) => dir.path ?? ''),
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze project architecture
   */
  private analyzeArchitecture(structure: ProjectStructure): ProjectArchitecture {
    const directories = structure.directories ?? [];

    // Check for layered architecture
    const layeredPatterns = ['presentation', 'business', 'data', 'infrastructure'];
    const layeredDirs = directories.filter((dir: DirectoryInfo) =>
      layeredPatterns.some(pattern => dir.name?.toLowerCase().includes(pattern))
    );

    if (layeredDirs.length >= 2) {
      return {
        type: 'layered',
        description: 'Layered architecture with separation of concerns',
        layers: this.buildArchitectureLayers(layeredDirs),
        modules: [],
        dependencies: [],
      };
    }

    // Check for modular architecture
    const modularDirs = directories.filter(
      (dir: DirectoryInfo) =>
        dir.name && (dir.name.includes('module') || dir.name.includes('feature'))
    );

    if (modularDirs.length > 0) {
      return {
        type: 'modular',
        description: 'Modular architecture with feature-based organization',
        layers: [],
        modules: this.buildArchitectureModules(modularDirs),
        dependencies: [],
      };
    }

    // Default to monolithic
    return {
      type: 'monolithic',
      description: 'Monolithic architecture',
      layers: [],
      modules: [],
      dependencies: [],
    };
  }

  /**
   * Build architecture layers
   */
  private buildArchitectureLayers(directories: DirectoryInfo[]): ArchitectureLayer[] {
    const layers: ArchitectureLayer[] = [];

    directories.forEach(dir => {
      const layerType = this.determineLayerType(dir.name);
      layers.push({
        name: dir.name ?? 'unknown',
        type: layerType,
        description: `${layerType} layer`,
        files: [],
        dependencies: [],
      });
    });

    return layers;
  }

  /**
   * Build architecture modules
   */
  private buildArchitectureModules(directories: DirectoryInfo[]): ArchitectureModule[] {
    const modules: ArchitectureModule[] = [];

    directories.forEach(dir => {
      const moduleType = this.determineModuleType(dir.name);
      modules.push({
        name: dir.name ?? 'unknown',
        type: moduleType,
        description: `${moduleType} module`,
        files: [],
        exports: [],
        imports: [],
      });
    });

    return modules;
  }

  /**
   * Determine layer type from directory name
   */
  private determineLayerType(
    name: string
  ): 'presentation' | 'business' | 'data' | 'infrastructure' | 'other' {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes('presentation') ||
      lowerName.includes('ui') ||
      lowerName.includes('view')
    ) {
      return 'presentation';
    }
    if (
      lowerName.includes('business') ||
      lowerName.includes('logic') ||
      lowerName.includes('service')
    ) {
      return 'business';
    }
    if (lowerName.includes('data') || lowerName.includes('model') || lowerName.includes('entity')) {
      return 'data';
    }
    if (
      lowerName.includes('infrastructure') ||
      lowerName.includes('config') ||
      lowerName.includes('util')
    ) {
      return 'infrastructure';
    }

    return 'other';
  }

  /**
   * Determine module type from directory name
   */
  private determineModuleType(
    name: string
  ): 'feature' | 'shared' | 'core' | 'infrastructure' | 'other' {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('feature') || lowerName.includes('component')) {
      return 'feature';
    }
    if (lowerName.includes('shared') || lowerName.includes('common')) {
      return 'shared';
    }
    if (lowerName.includes('core') || lowerName.includes('base')) {
      return 'core';
    }
    if (lowerName.includes('infrastructure') || lowerName.includes('config')) {
      return 'infrastructure';
    }

    return 'other';
  }

  /**
   * Calculate file statistics
   */
  private calculateFileStats(structure: ProjectStructure): {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    averageFileSize: number;
    averageLinesPerFile: number;
  } {
    const files = structure.files ?? [];
    const totalFiles = files.length;
    const totalLines = files.reduce((sum: number, file: FileInfo) => sum + (file.lines ?? 0), 0);
    const totalSize = files.reduce((sum: number, file: FileInfo) => sum + (file.size ?? 0), 0);

    return {
      totalFiles,
      totalLines,
      totalSize,
      averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0,
      averageLinesPerFile: totalFiles > 0 ? totalLines / totalFiles : 0,
    };
  }

  /**
   * Calculate directory statistics
   */
  private calculateDirectoryStats(structure: ProjectStructure): {
    totalDirectories: number;
    maxDepth: number;
    averageDepth: number;
    directoriesByDepth: Record<number, number>;
  } {
    const directories = structure.directories ?? [];
    const totalDirectories = directories.length;
    const maxDepth = this.calculateDepth(structure);

    const depthCounts: Record<number, number> = {};
    let totalDepth = 0;

    directories.forEach((dir: DirectoryInfo) => {
      let depth: number;
      if (dir.depth !== undefined) {
        depth = Math.max(0, dir.depth);
      } else {
        // Calculate depth from path by counting directory separators
        depth = Math.max(0, (dir.path ?? '').split('/').length - 1);
      }
      depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;
      totalDepth += depth;
    });

    return {
      totalDirectories,
      maxDepth,
      averageDepth: totalDirectories > 0 ? totalDepth / totalDirectories : 0,
      directoriesByDepth: depthCounts,
    };
  }
}
