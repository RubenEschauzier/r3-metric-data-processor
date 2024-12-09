import { IExperimentReadOutput, IResultTimingsTemplate, ITopologyOutput } from "./DataIngestor";
import * as di from 'diefficiency';
import * as fs from 'fs';
import * as path from 'path';

export class DiefficiencyMetricExperiment{
    public benchmarkData: Record<string, IExperimentReadOutput>;

    public constructor(data: Record<string, IExperimentReadOutput>){
        this.benchmarkData = data;

    }
    public async run(): Promise<Record<string, Record<string, ITemplateDieff>>> {
        const experimentOutputs: Record<string, Record<string, ITemplateDieff>> = {};
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
        const resultTimestamps = experimentData.templateToTimings;
        const templateToDiefficiency: Record<string, ITemplateDieff> = {};
        for (const template of Object.keys(relevantDocuments)){
            console.log(template)
            const templateMetrics = await this.calculateDiEfficiencyTemplate(
                topologies[template], relevantDocuments[template], resultTimestamps[template]
            );
            templateToDiefficiency[template] = templateMetrics;
        }
        return templateToDiefficiency
    }

    public async calculateDiEfficiencyTemplate(
        topologies: ITopologyOutput[][], 
        relevantDocuments: string[][][][],
        resultTimestamps: IResultTimingsTemplate
    ): Promise<ITemplateDieff> {
        const templateRetrievalDieff: IDieffOutput[] = []
        const templateResultDieff: IDieffOutput[] = [];
        const templateExecutionTimes: number[] = [];
        for (let i = 0; i < relevantDocuments.length; i++){
            // const queryRetrievalDieff: IDieffOutput[] = [];
            const queryRetrievalTimestamps: number[][] = [];
            for (let j = 0; j < relevantDocuments[i].length; j++){
                if (topologies[i][j] === undefined){
                    console.log(topologies.length)
                    console.log(topologies[i].length)
                    console.log(relevantDocuments.length)
                    console.log(relevantDocuments[i].length)
                }
                const relevantDocumentsAsIndex = relevantDocuments[i][j].map(x => {
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
                if(relevantDocumentsAsIndex.length > 0){
                    const timestamps = this.getRetrievalTimestamps(
                        topologies[i][j],
                        relevantDocumentsAsIndex,
                    );
                    queryRetrievalTimestamps.push(timestamps.zerodEventTimestamps);
                    // queryRetrievalDieff.push(this.calculateDiEfficiency(
                    //     timestamps.zerodEventTimestamps, 
                    //     relevantDocumentsAsIndex.length
                    // ));
                }
            }
            if (queryRetrievalTimestamps.length === 0){
                templateRetrievalDieff.push({
                    answerDistributionFunction: [-1],
                    dieff: -1,
                    linSpace: [-1]
                });
            }
            else{
                const averagedTimestamps = this.elementwiseMean(queryRetrievalTimestamps)
                    .sort(function(a, b){return a-b});
                const dieffRetrieval = this.calculateDiEfficiency(
                    averagedTimestamps, 
                    averagedTimestamps.length
                );
                templateRetrievalDieff.push(dieffRetrieval);
            }
            if (resultTimestamps.timestamps[i][0] == Number.NaN){
                templateResultDieff.push({answerDistributionFunction: [-1], dieff: -1, linSpace: [-1]});
                templateExecutionTimes.push(Number.NaN)
            }
            else{
                const dieffResults = this.calculateDiEfficiency(
                    resultTimestamps.timestamps[i], 
                    resultTimestamps.timestamps[i].length
                )
                templateResultDieff.push(dieffResults)
                const queryTemplateElapsedTimes = resultTimestamps.timeElapsed[i];
                templateExecutionTimes.push(queryTemplateElapsedTimes
                    .reduce((acc, val) => acc + val, 0) / queryTemplateElapsedTimes.length
                );
            }
        }
        return {
            retrievalDieff: templateRetrievalDieff,
            resultDieff: templateResultDieff,
            totalExecutionTime: templateExecutionTimes
        };
    }

    public calculateDiEfficiency(timestamps: number[], nResults: number): IDieffOutput{
        const output = di.DiEfficiencyMetric.answerDistributionFunction(timestamps, 10000)
        const dieff = di.DiEfficiencyMetric.defAtK(nResults, output.answerDist, output.linSpace)
       return { answerDistributionFunction: output.answerDist, dieff: dieff, linSpace: output.linSpace}
    }

    public elementwiseMean(data: number[][]){
        let maxLenghtArray: number = 0;
        for (let k = 0; k < data.length; k++){
            if (data[k].length > maxLenghtArray){
                maxLenghtArray = data[k].length
            }
        }
        const means: number[] = [];
        for (let i = 0; i < maxLenghtArray; i++){
            let totalAtI = 0;
            let nAtI = 0;
            for (let j = 0; j < data.length; j++){
                if (data[j][i]){
                    totalAtI += data[j][i];
                    nAtI++;
                }
            }
            means.push(totalAtI/nAtI);
        }
        return means;
    }

    public getRetrievalTimestamps(topology: ITopologyOutput, relevantDocuments: number[][]): IRetrievalTimestamps{
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
                        const nodeMetadata = topology.nodeMetadata[newVisitedNode[1]];
                        if (nodeMetadata.dereferenceTimestamp){
                            eventTimestamps.push(nodeMetadata.dereferenceTimestamp);
                        }
                        else{
                            // some instances (like short-4) use the seed document as source
                            // In this case there is no dereference timestamp (oops), 
                            // but dereference = discover timestamp
                            eventTimestamps.push(nodeMetadata.discoverTimestamp)
                        }
                    }
                }
            }
        }
        // Zero the timestamps by taking the first discover timestamp as first timestamp
        let firstDiscoverTimestamp = 0
        let i = 0;
        while (firstDiscoverTimestamp === 0){
            const metadata = topology.nodeMetadata[i];
            if (metadata.discoverTimestamp){
                firstDiscoverTimestamp = metadata.discoverTimestamp;
            }
            i++;
        }
        const zerodEventTimestamps = eventTimestamps.map(x=> x - firstDiscoverTimestamp)
            .sort(function(a, b){return a-b});

        return { zerodEventTimestamps, firstDiscoverTimestamp };
    }

    public static writeToFile(data: Record<string, Record<string, ITemplateDieff>>, outputLocation: string){
        for (const combination of Object.keys(data)){
            fs.writeFileSync(path.join(outputLocation, `dieff-${combination}.json`), JSON.stringify(data[combination]));
        }
    }

}

export interface IDieffOutput{
    answerDistributionFunction: number[];
    linSpace: number[];
    dieff: number;
}

export interface IRetrievalTimestamps{
    zerodEventTimestamps: number[];
    firstDiscoverTimestamp: number;
}

export interface ITemplateDieff{
    retrievalDieff: IDieffOutput[];
    resultDieff: IDieffOutput[];
    totalExecutionTime: number[];
}