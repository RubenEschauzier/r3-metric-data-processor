import { IExperimentReadOutput, ITopologyOutput } from "./DataIngestor";
export declare class DiefficiencyMetricExperiment {
    benchmarkData: Record<string, IExperimentReadOutput>;
    constructor(data: Record<string, IExperimentReadOutput>);
    run(): Promise<Record<string, Record<string, number[][]>>>;
    calculateDiEfficiencyExperiment(experimentData: IExperimentReadOutput): Promise<Record<string, number[][]>>;
    calculateDiEfficiencyTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][]): Promise<number[][]>;
    calculateDiEfficiency(timestamps: number[], nResults: number): number;
    getRetrievalTimestamps(topology: ITopologyOutput, relevantDocuments: number[][], tsType: 'event' | 'time'): number[];
    getAnswerDistribution(retrievalTimestamps: number[]): void;
    getResultRetrievalDistribution(): void;
}
