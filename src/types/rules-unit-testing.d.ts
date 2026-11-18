declare module '@firebase/rules-unit-testing' {
  export interface TestEnvironmentConfig {
    projectId: string;
    firestore?: {
      rules?: string;
      host?: string;
      port?: number;
    };
  }

  export interface RulesTestEnvironment {
    authenticatedContext(
      uid: string,
      token?: {
        email?: string;
        email_verified?: boolean;
        [key: string]: unknown;
      }
    ): RulesTestContext;
    unauthenticatedContext(): RulesTestContext;
    withSecurityRulesDisabled(
      callback: (context: RulesTestContext) => Promise<void>
    ): Promise<void>;
    clearFirestore(): Promise<void>;
    cleanup(): Promise<void>;
  }

  export interface RulesTestContext {
    firestore(): any;
  }

  export function initializeTestEnvironment(
    config: TestEnvironmentConfig
  ): Promise<RulesTestEnvironment>;
  export function assertFails<T = any>(pr: Promise<T>): Promise<any>;
  export function assertSucceeds<T = any>(pr: Promise<T>): Promise<T>;
}
