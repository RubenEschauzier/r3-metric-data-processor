"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstructOracleInput = void 0;
const dijkstra = require("dijkstrajs");
class ConstructOracleInput {
    static run(topology, queryToRcc) {
        const output = {};
        const shortestPaths = ConstructOracleInput.getShortestPaths(topology, queryToRcc);
        for (const target of Object.keys(shortestPaths)) {
            const path = shortestPaths[target];
            const rccDestination = queryToRcc[target];
            for (const nodeIndex of path) {
                const url = topology.indexToNode[nodeIndex];
                output[url] = rccDestination;
            }
        }
        return output;
    }
    static getShortestPaths(topology, queryToRcc) {
        const paths = {};
        const edgeList = topology.edgeList;
        const graph = ConstructOracleInput.convertToGraph(edgeList);
        for (const url of Object.keys(queryToRcc)) {
            const urlAsIndex = topology.nodeToIndex[url];
            if (urlAsIndex === undefined) {
                throw new Error("INVALID URL");
            }
            // Path from root document to whatever query relevant document
            const path = dijkstra.find_path(graph, 0, urlAsIndex).map((x) => Number(x));
            paths[url] = path;
        }
        return paths;
    }
    static convertToGraph(edgeList) {
        const graphStructure = {};
        for (const [from, to, weight = 1] of edgeList) {
            graphStructure[from] ?? (graphStructure[from] = {});
            graphStructure[from][to] = weight;
        }
        return graphStructure;
    }
}
exports.ConstructOracleInput = ConstructOracleInput;
//# sourceMappingURL=ConstructOracleInput.js.map