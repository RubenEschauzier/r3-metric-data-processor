import { IExperimentReadOutput, ITopologyOutput } from "./DataIngestor";
const dijkstra = require("dijkstrajs");

export class ConstructOracleInput{

    public static run(topology: ITopologyOutput, queryToRcc: Record<string, number>){
        const output: Record<string, number> = {};
        const shortestPaths = ConstructOracleInput.getShortestPaths(topology, queryToRcc);
        for (const target of Object.keys(shortestPaths)){
            const path = shortestPaths[target]
            const rccDestination = queryToRcc[target];
            for (const nodeIndex of path){
                const url = topology.indexToNode[nodeIndex];
                output[url] = rccDestination;
            }
        }
        return output
    }
    private static getShortestPaths(topology: ITopologyOutput, queryToRcc: Record<string, number>){
        const paths: Record<string, number[]> = {}
        const edgeList = topology.edgeList
        const graph = ConstructOracleInput.convertToGraph(edgeList);
        for (const url of Object.keys(queryToRcc)){
            const urlAsIndex = topology.nodeToIndex[url]
            if (urlAsIndex === undefined){
                throw new Error("INVALID URL");
            }
            // Path from root document to whatever query relevant document
            const path: number[] = dijkstra.find_path(graph, 0, urlAsIndex).map((x: string | number) => Number(x));
            paths[url] = path;
        }
        return paths
    }

    private static convertToGraph(edgeList: number[][]){
        const graphStructure: Record<number, Record<number, number>> = {}
        for (const [from, to, weight=1] of edgeList){
            graphStructure[from] ??= {};
            graphStructure[from][to] = weight;
        }
        return graphStructure
    }

    
}