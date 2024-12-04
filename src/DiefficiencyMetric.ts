import { IExperimentReadOutput, ITopologyOutput } from "./DataIngestor";
import * as di from 'diefficiency';

export class DiefficiencyMetricExperiment{
    public benchmarkData: Record<string, IExperimentReadOutput>;

    public constructor(data: Record<string, IExperimentReadOutput>){
        this.benchmarkData = data;

    }
    public async run(){
        const experimentOutputs: Record<string, Record<string, number[][]>> = {};
        for (const experiment of Object.keys(this.benchmarkData)){
            console.log(`Calculating for ${experiment}`);
            const templateMetrics = 
                await this.calculateDiEfficiencyExperiment(this.benchmarkData[experiment]);
            experimentOutputs[experiment] = templateMetrics;
        }
        return experimentOutputs;
    }

    public async calculateDiEfficiencyExperiment(experimentData: IExperimentReadOutput){
        const relevantDocuments = experimentData.templateToRelevantDocuments;
        const topologies = experimentData.templateToTopologies;
        const templateToDiefficiency: Record<string, number[][]> = {};
        for (const template of Object.keys(relevantDocuments)){
            console.log(template)
            const templateMetrics = await this.calculateDiEfficiencyTemplate(
                topologies[template], relevantDocuments[template]
            );
            templateToDiefficiency[template] = templateMetrics;
        }
        return templateToDiefficiency
    }

    public async calculateDiEfficiencyTemplate(topologies: ITopologyOutput[][], relevantDocuments: string[][][][]){
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
                // In case there are no relevant documents, the query timed out so diefficiency cant be computed
                if (relevanDocumentsAsIndex.length === 0){
                    queryMetrics.push(-1);
                }
                else{
                    const timestamps = this.getRetrievalTimestamps(
                        topologies[i][j],
                        relevanDocumentsAsIndex,
                        'event'
                    );
                    // TODO CHECK IF THE ANSWER DISTRIBUTION IS CORRECT!!
                    queryMetrics.push(this.calculateDiEfficiency(timestamps, relevanDocumentsAsIndex.length));    
                }
            }
            templateMetrics.push(queryMetrics);
        }
        return templateMetrics;
    }

    public calculateDiEfficiency(timestamps: number[], nResults: number){
        const output = di.DiEfficiencyMetric.answerDistributionFunction(timestamps, 1000)
        const dieff = di.DiEfficiencyMetric.defAtK(nResults, output.answerDist, output.linSpace)
       return dieff
    }

    public getRetrievalTimestamps(topology: ITopologyOutput, relevantDocuments: number[][], tsType: 'event' | 'time'){
        const engineTraversalPath = topology.dereferenceOrder
        // Iterate over engine traversal path, update to visit for result, after update check if new list is empty
        // if it is empty we have +1 result
        const eventTimestamps = []
        const progressUntillResult: Record<number, number[]> = {};
        for (let i = 0; i < relevantDocuments.length; i++){
            progressUntillResult[i] = relevantDocuments[i];
        }

        const traversalUntillAllVisited: number[][] = [];
        for (let i = 0; i < engineTraversalPath.length; i++){
            const newVisitedNode = engineTraversalPath[i];
            traversalUntillAllVisited.push(newVisitedNode);
            // Edge denotes traversal to second element of edge, so we only check if second element
            // Is a relevant node
            for (let j = 0; j < relevantDocuments.length; j++){
                if (progressUntillResult[j].includes(newVisitedNode[1])){
                    const nodes = [...progressUntillResult[j]];
                    // Remove currently found document
                    nodes.splice(nodes.indexOf(newVisitedNode[1]), 1);
                    progressUntillResult[j] = nodes;
                    if (progressUntillResult[j].length === 0){
                        if(tsType === 'time'){
                            // TODO get timestamp from topology dereference metadata and put it in here
                        }
                        if (tsType == 'event'){
                            // At traversal step i have we found a new result
                            eventTimestamps.push(i);
                        }
                    }
                }
            }
        }
        return eventTimestamps
    }

    public getAnswerDistribution(retrievalTimestamps: number[]){
        const distFunction =
         di.DiEfficiencyMetric.answerDistributionFunction(retrievalTimestamps, 1000);
        
    }

    public getResultRetrievalDistribution(){

    }
}