import * as r3 from 'relevant-retrieval-ratio';
import { IExperimentReadOutput, ITopologyOutput } from './DataIngestor';
export declare class R3Metric {
    metricCalculator: r3.RunLinkTraversalPerformanceMetrics;
    constructor();
    run(experiment: string, experimentOutput: IExperimentReadOutput): Promise<Record<string, ITemplateR3Metric>>;
    calculateMetricExperiment(experimentData: IExperimentReadOutput): Promise<Record<string, ITemplateR3Metric>>;
    calculateMetricTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][]): Promise<ITemplateR3Metric>;
    static writeToFile(data: Record<string, Record<string, ITemplateR3Metric>>, outputLocation: string): void;
}
export interface ITemplateR3Metric {
    unweighted: number[][];
    http: number[][];
}
