import { BaseVersioningStrategy, BranchVersioning, TimestampVersioning, CustomVersioning } from '../../../../src/versioning/strategies';

describe('versioning strategies index', () => {
  it('should export BaseVersioningStrategy', () => {
    expect(BaseVersioningStrategy).toBeDefined();
    expect(typeof BaseVersioningStrategy).toBe('function');
  });

  it('should export BranchVersioning', () => {
    expect(BranchVersioning).toBeDefined();
    expect(typeof BranchVersioning).toBe('function');
  });

  it('should export TimestampVersioning', () => {
    expect(TimestampVersioning).toBeDefined();
    expect(typeof TimestampVersioning).toBe('function');
  });

  it('should export CustomVersioning', () => {
    expect(CustomVersioning).toBeDefined();
    expect(typeof CustomVersioning).toBe('function');
  });

  it('should be able to instantiate exported classes', () => {
    const branchStrategy = new BranchVersioning();
    const timestampStrategy = new TimestampVersioning();
    const customStrategy = new CustomVersioning();
    
    expect(branchStrategy).toBeInstanceOf(BaseVersioningStrategy);
    expect(timestampStrategy).toBeInstanceOf(BaseVersioningStrategy);
    expect(customStrategy).toBeInstanceOf(BaseVersioningStrategy);
    expect(branchStrategy.getStrategyName()).toBe('branch');
    expect(timestampStrategy.getStrategyName()).toBe('timestamp');
    expect(customStrategy.getStrategyName()).toBe('custom');
  });
});
