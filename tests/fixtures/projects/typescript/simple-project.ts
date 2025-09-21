/**
 * Simple TypeScript project for testing
 */

// Simple class
export class SimpleClass {
  private property: string;

  constructor(property: string) {
    this.property = property;
  }

  public getProperty(): string {
    return this.property;
  }

  public setProperty(value: string): void {
    this.property = value;
  }
}

// Simple interface
export interface SimpleInterface {
  id: number;
  name: string;
  description?: string;
}

// Simple function
export function simpleFunction(param: string): string {
  return `Hello, ${param}!`;
}

// Simple type alias
export type SimpleType = string | number;

// Simple enum
export enum SimpleEnum {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
}

// Simple namespace
export namespace SimpleNamespace {
  export const CONSTANT = 'constant';
  
  export function helper(): void {
    console.log('Helper function');
  }
}

// Default export
export default SimpleClass;
