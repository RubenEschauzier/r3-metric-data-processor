import * as fs from 'fs';
import * as path from 'path';

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

    public isDistinctQuery(query: string){
        return query.includes('DISTINCT');
    }

    public getResultsData(queryPath: string, query: string){
        const resultsAllInstantiations: Record<any,any>[][] = [];
        const files = fs.readdirSync(queryPath)
            .filter(file => this.intermediateResultFilePattern.test(file));
        const filterDuplicates = this.isDistinctQuery(query);
        for (const file of files){
            const results: Set<string> = new Set();
            const resultsQuery: Record<any, any>[] = [];

            const data = fs.readFileSync(path.join(queryPath, file), 'utf-8').trim();
            const lines = data.split('\n')
            if (data.length > 0){
                for (const line of lines){
                    const resultData = JSON.parse(line);
                    if (resultData.operation === 'project'){
                        if (!filterDuplicates || !results.has(resultData.data)){
                            results.add(resultData.data);
                            resultsQuery.push(resultData);
                        }
                    }
                }    
            }
            resultsAllInstantiations.push(resultsQuery);
        }
        return resultsAllInstantiations;
    }

    public constructRelevantDocuments(resultsAllInstantiations: Record<any,any>[][]){
        const relevantDocuments: string[][][] = []
        for (let i = 0; i < resultsAllInstantiations.length; i++){
            const queryRelevant: string[][] = [];
            for (let j = 0; j < resultsAllInstantiations[i].length; j++){
                queryRelevant.push(JSON.parse(resultsAllInstantiations[i][j].provenance))
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
    public getTopologies(queryPath: string, query: string){
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
            const weightedEdgesInOrder = this.constructEdgesInOrder(topology, 'unweighted');
            const processedTopology: ITopologyOutput = {
                edgeList,
                dereferenceOrder: weightedEdgesInOrder,
                indexToNode: topology.indexToNodeDict,
                nodeToIndex: topology.nodeToIndexDict,
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
        const templateToTopologies: Record<string, ITopologyOutput[][]> = {}
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
                path.join(experimentLocation, pathToQuery), query
            );
            templateToRelevantDocuments[template].push(relevantDocuments);
            templateToTopologies[template].push(topologiesQueryInstantiation);
            templateToResults[template].push(results)
        });
        return { templateToRelevantDocuments, templateToTopologies, templateToResults }
    }
}

export interface ITopologyOutput{
    edgeList: number[][];
    dereferenceOrder: number[][];
    nodeToIndex: Record<string, number>;
    indexToNode: Record<number, string>;
    seedDocuments: number[];
}

export interface IExperimentReadOutput{
    templateToRelevantDocuments: Record<string, string[][][][]>;
    templateToTopologies: Record<string, ITopologyOutput[][]>;
    templateToResults: Record<string , Record<any,any>[][][]>
}