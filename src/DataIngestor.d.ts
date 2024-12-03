export declare class DataIngestor {
    dataLocation: string;
    intermediateResultFilePattern: RegExp;
    topologyFilePattern: RegExp;
    constructor(dataLocation: string);
    read(): Record<string, IExperimentReadOutput>;
    isDistinctQuery(query: string): boolean;
    getResultsData(queryPath: string, query: string): Record<any, any>[][];
    constructRelevantDocuments(resultsAllInstantiations: Record<any, any>[][]): string[][][];
    /**
     * Get topologies in format expected by R3 metric, so as edgelist,
     * traversal path, and seed documents.
     * @param queryPath
     * @param query
     * @returns
     */
    getTopologies(queryPath: string, query: string): ITopologyOutput[];
    /**
     * This function should work to retrieve seed documents for the returned metadata from Comunica.
     * @param topology
     * @returns
     */
    getSeedDocuments(topology: Record<string, any>): number[];
    constructEdgeList(topology: any, weightType: 'unweighted' | 'http' | 'documentSize'): number[][];
    constructEdgesInOrder(topology: any, weightType: 'unweighted' | 'http' | 'documentSize'): any;
    readFullExperiment(experimentLocation: string): IExperimentReadOutput;
}
export interface ITopologyOutput {
    edgeList: number[][];
    dereferenceOrder: number[][];
    nodeToIndex: Record<string, number>;
    indexToNode: Record<number, string>;
    seedDocuments: number[];
}
export interface IExperimentReadOutput {
    templateToRelevantDocuments: Record<string, string[][][][]>;
    templateToTopologies: Record<string, ITopologyOutput[][]>;
    templateToResults: Record<string, Record<any, any>[][][]>;
}
