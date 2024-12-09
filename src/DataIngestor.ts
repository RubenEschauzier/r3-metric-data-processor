import * as fs from 'fs';
import * as path from 'path';
import { parse, ParseResult } from 'papaparse';

export class DataIngestor{
    public dataLocation: string;
    // We can make this setable in future versions if this gets reused.
    public intermediateResultFilePattern = /^StatisticIntermediateResults_\d+\.txt$/;
    public topologyFilePattern = /^StatisticTraversalTopology_\d+\.txt$/
    public constructor(dataLocation: string){
        this.dataLocation = dataLocation;

    }

    public read(){
        const experiments = fs.readdirSync(this.dataLocation);
        const experimentOutputs: Record<string, IExperimentReadOutput> = {}
        for (const experiment of experiments){
            // TODO: Push to final output
            const experimentOutput = this.readFullExperiment(path.join(this.dataLocation, experiment));
            experimentOutputs[experiment] = experimentOutput;
        }
        return  experimentOutputs;
    }
    /**
     * Read result time stamps and total elapsed time per query to construct diefficiency with
     */
    public readTimestamps(){

    }

    public isDistinctQuery(query: string){
        return query.includes('DISTINCT');
    }

    public getResultsData(queryPath: string, query: string){
        const files = fs.readdirSync(queryPath)
            .filter(file => this.intermediateResultFilePattern.test(file));
        const filterDuplicates = this.isDistinctQuery(query);
        const queryToProvenanceSize: Record<string, Record<string, number>> = {};
        const fileData: Record<string, IResultDataProcessed[]> = {};
        for (const file of files){
            // Provenance is streamed, so first 'results' have incomplete provenance
            // This filters out incomplete provenance from results
            const resultToProvenanceSize: Record<string, number> = {};
            const dataQuery: IResultDataProcessed[] = [];
            const data = fs.readFileSync(path.join(queryPath, file), 'utf-8').trim();
            if (data.length > 0){
                const lines = data.split('\n')
                for (const line of lines){
                    const resultData: IResultDataRaw = JSON.parse(line);
                    resultToProvenanceSize[resultData.data] ??= 1;
                    if (resultData.operation === 'project'){
                        const prov: string[] = JSON.parse(resultData.provenance);
                        if (prov.length > resultToProvenanceSize[resultData.data]){
                            resultToProvenanceSize[resultData.data] = prov.length
                        }
                        const processedData: IResultDataProcessed = {
                            data: resultData.data,
                            provenance: prov,
                            operation: resultData.operation,
                            timestamp: resultData.timestamp
                        };
                        dataQuery.push(processedData);
                    }
                }    
            }
            fileData[file] = dataQuery;
            queryToProvenanceSize[file] = resultToProvenanceSize;    
        }
        const resultsAllInstantiations: IResultDataProcessed[][] = [];
        for (const file of files){
            const results: Set<string> = new Set();
            const resultsQuery: IResultDataProcessed[] = [];

            const data = fileData[file];
            const provenanceLength = queryToProvenanceSize[file];
            for (const result of data){
                // Filter out incomplete provenance annotations
                if (result.provenance.length === provenanceLength[result.data]){
                    // Filter out duplicates if distinct is in the query
                    if (!filterDuplicates || !results.has(result.data)){
                        results.add(result.data);
                        resultsQuery.push(result);
                    }    
                }
            }
            resultsAllInstantiations.push(resultsQuery);
        }
        return resultsAllInstantiations;
    }

    public constructRelevantDocuments(resultsAllInstantiations: Record<any,any>[][]){
        const relevantDocuments: string[][][] = [];
        for (let i = 0; i < resultsAllInstantiations.length; i++){
            const queryRelevant: string[][] = [];
            for (let j = 0; j < resultsAllInstantiations[i].length; j++){
                queryRelevant.push(resultsAllInstantiations[i][j].provenance)
            }
            relevantDocuments.push(queryRelevant);
        }
        return relevantDocuments;
    }

    /**
     * Get topologies in format expected by R3 metric, so as edgelist, 
     * traversal path, and seed documents.
     * @param queryPath 
     * @param query 
     * @returns 
     */
    public getTopologies(queryPath: string){
        const topologies: ITopologyOutput[] = [];
        const files = fs.readdirSync(queryPath)
            .filter(file => this.topologyFilePattern.test(file));
        for (const file of files){
            const topology = JSON.parse(fs.readFileSync(path.join(queryPath, file), 'utf-8').trim());
            // In our case the seed documents are always zero because there is 1 seed document.
            // Normally you would get seed document for metadata, but the metadata run failed and
            // time constraints require this 'hack'
            const seedDocuments = [ 0 ];
            const edgeList = this.constructEdgeList(topology, 'unweighted');
            const edgeListHttp = this.constructEdgeList(topology, 'http');
            const EdgesInOrder = this.constructEdgesInOrder(topology, 'unweighted');
            const EdgesInOrderHttp = this.constructEdgesInOrder(topology, 'http');
            const processedTopology: ITopologyOutput = {
                edgeList,
                edgeListHttp: edgeListHttp,
                dereferenceOrder: EdgesInOrder,
                dereferenceOrderHttp: EdgesInOrderHttp,
                indexToNode: topology.indexToNodeDict,
                nodeToIndex: topology.nodeToIndexDict,
                nodeMetadata: topology.nodeMetadata,
                seedDocuments
            };
            topologies.push(processedTopology);
        }
        return topologies;
    }

    /**
     * This function should work to retrieve seed documents for the returned metadata from Comunica.
     * @param topology 
     * @returns 
     */
    public getSeedDocuments(topology: Record<string, any>){
        const seedDocuments: number[] = [];
        Object.entries(topology.nodeMetadata).forEach(([key, value]: [string, any]) =>{
            if (value['seed'] === true){
                seedDocuments.push(Number(key));
            }
        })
        return seedDocuments
    }

    public constructEdgeList(topology: any, weightType: 'unweighted' | 'http' | 'documentSize'){
        const edgeList: number[][] = [];
        Object.entries(topology.adjacencyListOut).forEach(([key, value]: [string, number[]]) => {
            for (const target of value){
                const edge = [Number(key), target, 1];
                if (weightType === 'http'){
                    const requestTime = topology.nodeMetadata[target]['httpRequestTime'];
                    if (requestTime && requestTime > 0) edge[2] = requestTime
                }
                if (weightType === 'documentSize'){
                    
                }
                edgeList.push(edge);
            }
        })
        return edgeList;
    }

    public constructEdgesInOrder(topology: any, weightType: 'unweighted' | 'http' | 'documentSize'){
        return topology.edgesInOrder.map((edge: number[]) => { 
            const weightedEdge = [edge[0], edge[1], 1];
            if(weightType == 'http'){
                const requestTime = topology.nodeMetadata[edge[1]]['httpRequestTime'];
                if (requestTime && requestTime > 0) weightedEdge[2] = requestTime
            }
            if(weightType=='documentSize'){

            }
            return weightedEdge
        });
    }

    public readFullExperiment(experimentLocation: string): IExperimentReadOutput{
        const base64ToDirectory: Record<string, string> = JSON.parse(
            fs.readFileSync(
                path.join(experimentLocation, 'base64ToDirectory.json'),
                'utf-8'
            )
        );
        const templateToResults: Record<string , Record<any,any>[][][]> = {};
        const templateToRelevantDocuments: Record<string, string[][][][]> = {}; 
        const templateToTopologies: Record<string, ITopologyOutput[][]> = {};
        Object.entries(base64ToDirectory).forEach(([base64Query, pathToQuery]) => {
            const query = atob(base64Query);
            const template = pathToQuery.split("/")[0];
            templateToRelevantDocuments[template] ??= [];
            templateToTopologies[template] ??= [];
            templateToResults[template] ??= [];

            const results = this.getResultsData(
                path.join(experimentLocation, pathToQuery), query
            );
            const relevantDocuments = this.constructRelevantDocuments(results)
            const topologiesQueryInstantiation = this.getTopologies(
                path.join(experimentLocation, pathToQuery)
            );
            templateToRelevantDocuments[template].push(relevantDocuments);
            templateToTopologies[template].push(topologiesQueryInstantiation);
            templateToResults[template].push(results)
        });
        const queryTimesRaw = fs.readFileSync(path.join(experimentLocation, 'query-times.csv'), 'utf8');
        const parsedQueryTimes = parse(queryTimesRaw, {
            delimiter: ';', // Specify the delimiter
            header: true,   // Use the first row as the header
          });
        const templateToTimings = this.processExperimentQueryTimes(parsedQueryTimes);
          
        return { templateToRelevantDocuments, templateToTopologies, templateToResults, templateToTimings }
    }

    public processExperimentQueryTimes(queryTimes: ParseResult<any>){
        const templateToResultTimings: Record<string, IResultTimingsTemplate> = {};
        for (const row of queryTimes.data){
            templateToResultTimings[row.name] ??= {
                timestamps: [],
                timeElapsed: [],
                timeOut: []
            };
            const timedOut = row.error === 'true';
            templateToResultTimings[row.name].timeOut.push(timedOut);
            if ( row.time !== undefined ){
                if (row.time === '0' && timedOut){
                    templateToResultTimings[row.name].timestamps.push([NaN]);
                    templateToResultTimings[row.name].timeElapsed.push([NaN]);
                }
                else{
                    templateToResultTimings[row.name].timestamps.push(
                        row.timestamps.split(' ').map((x: string) => Number(x))
                    )
                    templateToResultTimings[row.name].timeElapsed.push(
                        row.times.split(' ').map((x: string) => Number(x))
                    );
                }    
            }
        }
        return templateToResultTimings;
    }
}

export interface ITopologyOutput{
    edgeList: number[][];
    edgeListHttp: number[][];
    dereferenceOrder: number[][];
    dereferenceOrderHttp: number[][];
    nodeToIndex: Record<string, number>;
    indexToNode: Record<number, string>;
    nodeMetadata: Record<string, Record<any, any>>;
    seedDocuments: number[];
}

export interface IExperimentReadOutput{
    templateToRelevantDocuments: Record<string, string[][][][]>;
    templateToTopologies: Record<string, ITopologyOutput[][]>;
    templateToResults: Record<string , Record<any,any>[][][]>;
    templateToTimings: Record<string, IResultTimingsTemplate>;
}

/**
 * Interface of the processed data from the statisticIntermediateResults output log of Comunica
 */
export interface IResultDataProcessed{
    provenance: string[];
    data: string;
    operation: string;
    timestamp: number;
}

/**
 * Interface of the data in the statisticIntermediateResults output log of Comunica
 */
export interface IResultDataRaw{
    provenance: string;
    data: string;
    operation: string;
    timestamp: number;
}

export interface IResultTimingsTemplate{
    timestamps: number[][];
    timeElapsed: number[][];
    timeOut: boolean[];
}