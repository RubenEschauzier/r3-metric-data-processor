import { IExperimentReadOutput, IResultTimingsTemplate, ITopologyOutput } from "./DataIngestor";
export declare class DiefficiencyMetricExperiment {
    constructor();
    run(experiment: string, experimentOutput: IExperimentReadOutput): Promise<Record<string, ITemplateDieff>>;
    calculateDiEfficiencyExperiment(experimentData: IExperimentReadOutput): Promise<Record<string, ITemplateDieff>>;
    calculateDiEfficiencyTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][], resultTimestamps: IResultTimingsTemplate): Promise<ITemplateDieff>;
    calculateDiEfficiency(timestamps: number[], nResults: number): IDieffOutput;
    elementwiseMean(data: number[][]): number[];
    getRetrievalTimestamps(topology: ITopologyOutput, relevantDocuments: number[][]): IRetrievalTimestamps;
    static writeToFile(data: Record<string, Record<string, ITemplateDieff>>, outputLocation: string): void;
}
export interface IDieffOutput {
    answerDistributionFunction: number[];
    linSpace: number[];
    dieff: number;
}
export interface IRetrievalTimestamps {
    zerodEventTimestamps: number[];
    firstDiscoverTimestamp: number;
}
export interface ITemplateDieff {
    retrievalDieff: IDieffOutput[];
    resultDieff: IDieffOutput[];
    totalExecutionTime: number[];
}
