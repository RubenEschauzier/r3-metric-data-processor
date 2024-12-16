import { ITopologyOutput } from "./DataIngestor";
export declare class ConstructOracleInput {
    static run(topology: ITopologyOutput, queryToRcc: Record<string, number>): Record<string, number>;
    private static getShortestPaths;
    private static convertToGraph;
}
