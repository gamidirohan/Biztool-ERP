declare module "webgazer" {
  export interface WebgazerPrediction {
    x: number;
    y: number;
  }

  export interface WebgazerAPI {
    begin(): WebgazerAPI;
    start(): WebgazerAPI;
    end(): void;
    setGazeListener(
      listener: (data: WebgazerPrediction | null, timestamp?: number) => void
    ): WebgazerAPI;
    clearGazeListener(): WebgazerAPI;
    showPredictionPoints(show: boolean): WebgazerAPI;
    calibrate(x: number, y: number): void;
  }

  const webgazer: WebgazerAPI;
  export default webgazer;
}

declare global {
  interface Window {
    webgazer?: typeof import("webgazer");
  }
}
