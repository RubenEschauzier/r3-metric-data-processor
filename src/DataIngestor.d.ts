import { ParseResult } from 'papaparse';
export declare class DataIngestor {
    dataLocation: string;
    intermediateResultFilePattern: RegExp;
    topologyFilePattern: RegExp;
    constructor(dataLocation: string);
    read(): Generator<IDataIngested>;
    /**
     * Read result time stamps and total elapsed time per query to construct diefficiency with
     */
    readTimestamps(): void;
    isDistinctQuery(query: string): boolean;
    getResultsData(queryPath: string, query: string): IResultDataProcessed[][];
    constructRelevantDocuments(resultsAllInstantiations: Record<any, any>[][]): string[][][];
    /**
     * Get topologies in format expected by R3 metric, so as edgelist,
     * traversal path, and seed documents.
     * @param queryPath
     * @param query
     * @returns
     */
    getTopologies(queryPath: string): ITopologyOutput[];
    /**
     * This function should work to retrieve seed documents for the returned metadata from Comunica.
     * @param topology
     * @returns
     */
    getSeedDocuments(topology: Record<string, any>): number[];
    constructEdgeList(topology: any, weightType: 'unweighted' | 'http' | 'documentSize'): number[][];
    constructEdgesInOrder(topology: any, weightType: 'unweighted' | 'http' | 'documentSize'): number[][];
    readFullExperiment(experimentLocation: string): IExperimentReadOutput;
    processExperimentQueryTimes(queryTimes: ParseResult<any>): Record<string, IResultTimingsTemplate>;
}
export interface ITopologyOutput {
    edgeList: number[][];
    edgeListHttp: number[][];
    dereferenceOrder: number[][];
    dereferenceOrderHttp: number[][];
    nodeToIndex: Record<string, number>;
    indexToNode: Record<number, string>;
    nodeMetadata: Record<string, Record<any, any>>;
    seedDocuments: number[];
}
export interface IExperimentReadOutput {
    templateToRelevantDocuments: Record<string, string[][][][]>;
    templateToTopologies: Record<string, ITopologyOutput[][]>;
    templateToResults: Record<string, Record<any, any>[][][]>;
    templateToTimings: Record<string, IResultTimingsTemplate>;
    oracleRccValues: Record<string, Record<string, number>>;
}
/**
 * Interface of the processed data from the statisticIntermediateResults output log of Comunica
 */
export interface IResultDataProcessed {
    provenance: string[];
    data: string;
    operation: string;
    timestamp: number;
}
/**
 * Interface of the data in the statisticIntermediateResults output log of Comunica
 */
export interface IResultDataRaw {
    provenance: string;
    data: string;
    operation: string;
    timestamp: number;
}
export interface IResultTimingsTemplate {
    timestamps: number[][];
    timeElapsed: number[][];
    timeOut: boolean[];
}
export interface IDataIngested {
    experiment: string;
    experimentOutput: IExperimentReadOutput;
}
