"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataIngestor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataIngestor {
    constructor(dataLocation) {
        // We can make this setable in future versions if this gets reused.
        this.intermediateResultFilePattern = /^StatisticIntermediateResults_\d+\.txt$/;
        this.topologyFilePattern = /^StatisticTraversalTopology_\d+\.txt$/;
        this.dataLocation = dataLocation;
    }
    read() {
        const experiments = fs.readdirSync(this.dataLocation);
        const experimentOutputs = {};
        for (const experiment of experiments) {
            // TODO: Push to final output
            const experimentOutput = this.readFullExperiment(path.join(this.dataLocation, experiment));
            experimentOutputs[experiment] = experimentOutput;
        }
        return experimentOutputs;
    }
    isDistinctQuery(query) {
        return query.includes('DISTINCT');
    }
    constructRelevantDocuments(queryPath, query) {
        const queryRelevantAllInstantiations = [];
        const files = fs.readdirSync(queryPath)
            .filter(file => this.intermediateResultFilePattern.test(file));
        const filterDuplicates = this.isDistinctQuery(query);
        for (const file of files) {
            const results = new Set();
            const queryRelevant = [];
            const data = fs.readFileSync(path.join(queryPath, file), 'utf-8').trim();
            const lines = data.split('\n');
            if (data.length > 0) {
                for (const line of lines) {
                    const resultData = JSON.parse(line);
                    if (resultData.operation == 'project') {
                        if (!filterDuplicates || !results.has(resultData.data)) {
                            results.add(resultData.data);
                            const prov = JSON.parse(resultData.provenance);
                            queryRelevant.push(prov);
                        }
                    }
                }
            }
            queryRelevantAllInstantiations.push(queryRelevant);
        }
        return queryRelevantAllInstantiations;
    }
    /**
     * Get topologies in format expected by R3 metric, so as edgelist,
     * traversal path, and seed documents.
     * @param queryPath
     * @param query
     * @returns
     */
    getTopologies(queryPath, query) {
        const topologies = [];
        const files = fs.readdirSync(queryPath)
            .filter(file => this.topologyFilePattern.test(file));
        for (const file of files) {
            const topology = JSON.parse(fs.readFileSync(path.join(queryPath, file), 'utf-8').trim());
            // In our case the seed documents are always zero because there is 1 seed document.
            // Normally you would get seed document for metadata, but the metadata run failed and
            // time constraints require this 'hack'
            const seedDocuments = [0];
            const edgeList = this.constructEdgeList(topology, 'unweighted');
            const weightedEdgesInOrder = this.constructEdgesInOrder(topology, 'unweighted');
            const processedTopology = {
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
    getSeedDocuments(topology) {
        const seedDocuments = [];
        Object.entries(topology.nodeMetadata).forEach(([key, value]) => {
            if (value['seed'] === true) {
                seedDocuments.push(Number(key));
            }
        });
        return seedDocuments;
    }
    constructEdgeList(topology, weightType) {
        const edgeList = [];
        Object.entries(topology.adjacencyListOut).forEach(([key, value]) => {
            for (const target of value) {
                const edge = [Number(key), target, 1];
                if (weightType === 'http') {
                }
                if (weightType === 'documentSize') {
                }
                edgeList.push(edge);
            }
        });
        return edgeList;
    }
    constructEdgesInOrder(topology, weightType) {
        return topology.edgesInOrder.map((edge) => {
            const weightedEdge = [edge[0], edge[1], 1];
            if (weightType == 'http') {
            }
            if (weightType == 'documentSize') {
            }
            return weightedEdge;
        });
    }
    readFullExperiment(experimentLocation) {
        const base64ToDirectory = JSON.parse(fs.readFileSync(path.join(experimentLocation, 'base64ToDirectory.json'), 'utf-8'));
        const templateToRelevantDocuments = {};
        const templateToTopologies = {};
        Object.entries(base64ToDirectory).forEach(([base64Query, pathToQuery]) => {
            const query = atob(base64Query);
            const template = pathToQuery.split("/")[0];
            templateToRelevantDocuments[template] ?? (templateToRelevantDocuments[template] = []);
            templateToTopologies[template] ?? (templateToTopologies[template] = []);
            const relevantDocuments = this.constructRelevantDocuments(path.join(experimentLocation, pathToQuery), query);
            const topologiesQueryInstantiation = this.getTopologies(path.join(experimentLocation, pathToQuery), query);
            templateToRelevantDocuments[template].push(relevantDocuments);
            templateToTopologies[template].push(topologiesQueryInstantiation);
        });
        return { templateToRelevantDocuments, templateToTopologies };
    }
}
exports.DataIngestor = DataIngestor;
//# sourceMappingURL=DataIngestor.js.map