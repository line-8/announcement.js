import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  rootDir: process.cwd(),
  collectCoverage: true,
  coverageReporters: ["text"]
};
export default config;
