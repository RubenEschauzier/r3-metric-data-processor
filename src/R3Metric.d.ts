import * as r3 from 'comunica-experiment-performance-metric';
import { IExperimentReadOutput, ITopologyOutput } from './DataIngestor';
export declare class R3Metric {
    benchmarkData: Record<string, IExperimentReadOutput>;
    metricCalculator: r3.RunLinkTraversalPerformanceMetrics;
    constructor(data: Record<string, IExperimentReadOutput>);
    run(): Promise<Record<string, Record<string, number[][]>>>;
    calculateMetricExperiment(experimentData: IExperimentReadOutput): Promise<Record<string, number[][]>>;
    calculateMetricTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][]): Promise<number[][]>;
    calculateWeightedR3MetricExperiment(): void;
    static writeToFile(data: Record<string, Record<string, number[][]>>, outputLocation: string): void;
}
