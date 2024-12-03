import * as r3 from 'comunica-experiment-performance-metric';
import { IExperimentReadOutput, ITopologyOutput } from './DataIngestor';
import * as fs from 'fs';
import * as path from 'path';

export class R3Metric{
    public benchmarkData: Record<string, IExperimentReadOutput>;
    public metricCalculator: r3.RunLinkTraversalPerformanceMetrics;

    public constructor(data: Record<string, IExperimentReadOutput>){
        this.benchmarkData = data;
        this.metricCalculator = new r3.RunLinkTraversalPerformanceMetrics();
    }

    public async run(){
        const experimentOutputs: Record<string, Record<string, number[][]>> = {};
        for (const experiment of Object.keys(this.benchmarkData)){
            console.log(`Calculating for ${experiment}`);
            const templateMetrics = 
                await this.calculateMetricExperiment(this.benchmarkData[experiment]);
            experimentOutputs[experiment] = templateMetrics;
        }
        return experimentOutputs;
    }

    public async calculateMetricExperiment(experimentData: IExperimentReadOutput){
        const relevantDocuments = experimentData.templateToRelevantDocuments;
        const topologies = experimentData.templateToTopologies;
        const templateToR3: Record<string, number[][]> = {};
        for (const template of Object.keys(relevantDocuments)){
            console.log(template)
            const templateMetrics = await this.calculateMetricTemplate(
                topologies[template], relevantDocuments[template]
            );
            templateToR3[template] = templateMetrics;
        }
        return templateToR3
    }

    public async calculateMetricTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][]){
        const templateMetrics: number[][] = []
        for (let i = 0; i < relevantDocuments.length; i++){
            const queryMetrics: number[] = [];
            for (let j = 0; j < relevantDocuments[i].length; j++){
                if (topologies[i][j] === undefined){
                    console.log(topologies.length)
                    console.log(topologies[i].length)
                    console.log(relevantDocuments.length)
                    console.log(relevantDocuments[i].length)
                }
                const numNodes = Object.keys(topologies[i][j].indexToNode).length;
                const relevanDocumentsAsIndex = relevantDocuments[i][j].map(x => {
                    return x.map(y => {
                        const indexedNode = topologies[i][j].nodeToIndex[y]
                        if (indexedNode === undefined){
                            console.log(topologies[i][j].nodeToIndex)
                            console.log(`Node: ${y} not in node to index for i,j,y${[i,j,y]}`);
                        }
                        return indexedNode
                    });
                });
                // In case there are no relevant documents, the query timed out so R3 can't be computed
                if (relevanDocumentsAsIndex.length === 0){
                    queryMetrics.push(-1);
                }
                else{
                    const output = await this.metricCalculator.runMetricAll(
                        topologies[i][j].edgeList,
                        relevanDocumentsAsIndex,
                        topologies[i][j].dereferenceOrder,
                        topologies[i][j].seedDocuments,
                        numNodes
                    );
                    queryMetrics.push(output);    
                }
            }
            templateMetrics.push(queryMetrics);
        }
        return templateMetrics;
    }

    public calculateWeightedR3MetricExperiment(){

    }


    public static writeToFile(data: Record<string, Record<string, number[][]>>, outputLocation: string){
        for (const combination of Object.keys(data)){
            fs.writeFileSync(path.join(outputLocation, `${combination}.json`), JSON.stringify(data))
        }
    }
}