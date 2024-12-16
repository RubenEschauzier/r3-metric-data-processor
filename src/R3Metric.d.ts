import * as r3 from 'comunica-experiment-performance-metric';
import { IExperimentReadOutput, ITopologyOutput } from './DataIngestor';
export declare class R3Metric {
    benchmarkData: Record<string, IExperimentReadOutput>;
    metricCalculator: r3.RunLinkTraversalPerformanceMetrics;
    constructor(data: Record<string, IExperimentReadOutput>);
    run(): Promise<Record<string, Record<string, ITemplateR3Metric>>>;
    calculateMetricExperiment(experimentData: IExperimentReadOutput): Promise<Record<string, ITemplateR3Metric>>;
    calculateMetricTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][]): Promise<ITemplateR3Metric>;
    static writeToFile(data: Record<string, Record<string, ITemplateR3Metric>>, outputLocation: string): void;
}
export interface ITemplateR3Metric {
    unweighted: number[][];
    http: number[][];
}
