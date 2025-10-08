export {};

declare global {
  type ClarityCommand = (command: string, ...args: unknown[]) => void;

  interface Window {
    clarity?: ClarityCommand & {
      q?: unknown[];
    };
  }
}
