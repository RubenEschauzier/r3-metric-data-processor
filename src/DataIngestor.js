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
const papaparse_1 = require("papaparse");
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
    /**
     * Read result time stamps and total elapsed time per query to construct diefficiency with
     */
    readTimestamps() {
    }
    isDistinctQuery(query) {
        return query.includes('DISTINCT');
    }
    getResultsData(queryPath, query) {
        var _a;
        const files = fs.readdirSync(queryPath)
            .filter(file => this.intermediateResultFilePattern.test(file));
        const filterDuplicates = this.isDistinctQuery(query);
        const queryToProvenanceSize = {};
        const fileData = {};
        for (const file of files) {
            // Provenance is streamed, so first 'results' have incomplete provenance
            // This filters out incomplete provenance from results
            const resultToProvenanceSize = {};
            const dataQuery = [];
            const data = fs.readFileSync(path.join(queryPath, file), 'utf-8').trim();
            if (data.length > 0) {
                const lines = data.split('\n');
                for (const line of lines) {
                    const resultData = JSON.parse(line);
                    resultToProvenanceSize[_a = resultData.data] ?? (resultToProvenanceSize[_a] = 1);
                    if (resultData.operation === 'project') {
                        const prov = JSON.parse(resultData.provenance);
                        if (prov.length > resultToProvenanceSize[resultData.data]) {
                            resultToProvenanceSize[resultData.data] = prov.length;
                        }
                        const processedData = {
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
        const resultsAllInstantiations = [];
        for (const file of files) {
            const results = new Set();
            const resultsQuery = [];
            const data = fileData[file];
            const provenanceLength = queryToProvenanceSize[file];
            for (const result of data) {
                // Filter out incomplete provenance annotations
                if (result.provenance.length === provenanceLength[result.data]) {
                    // Filter out duplicates if distinct is in the query
                    if (!filterDuplicates || !results.has(result.data)) {
                        results.add(result.data);
                        resultsQuery.push(result);
                    }
                }
            }
            resultsAllInstantiations.push(resultsQuery);
        }
        return resultsAllInstantiations;
    }
    constructRelevantDocuments(resultsAllInstantiations) {
        const relevantDocuments = [];
        for (let i = 0; i < resultsAllInstantiations.length; i++) {
            const queryRelevant = [];
            for (let j = 0; j < resultsAllInstantiations[i].length; j++) {
                queryRelevant.push(resultsAllInstantiations[i][j].provenance);
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
    getTopologies(queryPath) {
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
            const edgeListHttp = this.constructEdgeList(topology, 'http');
            const EdgesInOrder = this.constructEdgesInOrder(topology, 'unweighted');
            const EdgesInOrderHttp = this.constructEdgesInOrder(topology, 'http');
            const processedTopology = {
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
                    const requestTime = topology.nodeMetadata[target]['httpRequestTime'];
                    if (requestTime)
                        edge[2] = requestTime;
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
                const requestTime = topology.nodeMetadata[edge[1]]['httpRequestTime'];
                if (requestTime)
                    edge[2] = requestTime;
            }
            if (weightType == 'documentSize') {
            }
            return weightedEdge;
        });
    }
    readFullExperiment(experimentLocation) {
        const base64ToDirectory = JSON.parse(fs.readFileSync(path.join(experimentLocation, 'base64ToDirectory.json'), 'utf-8'));
        const templateToResults = {};
        const templateToRelevantDocuments = {};
        const templateToTopologies = {};
        Object.entries(base64ToDirectory).forEach(([base64Query, pathToQuery]) => {
            const query = atob(base64Query);
            const template = pathToQuery.split("/")[0];
            templateToRelevantDocuments[template] ?? (templateToRelevantDocuments[template] = []);
            templateToTopologies[template] ?? (templateToTopologies[template] = []);
            templateToResults[template] ?? (templateToResults[template] = []);
            const results = this.getResultsData(path.join(experimentLocation, pathToQuery), query);
            const relevantDocuments = this.constructRelevantDocuments(results);
            const topologiesQueryInstantiation = this.getTopologies(path.join(experimentLocation, pathToQuery));
            templateToRelevantDocuments[template].push(relevantDocuments);
            templateToTopologies[template].push(topologiesQueryInstantiation);
            templateToResults[template].push(results);
        });
        const queryTimesRaw = fs.readFileSync(path.join(experimentLocation, 'query-times.csv'), 'utf8');
        const parsedQueryTimes = (0, papaparse_1.parse)(queryTimesRaw, {
            delimiter: ';', // Specify the delimiter
            header: true, // Use the first row as the header
        });
        const templateToTimings = this.processExperimentQueryTimes(parsedQueryTimes);
        return { templateToRelevantDocuments, templateToTopologies, templateToResults, templateToTimings };
    }
    processExperimentQueryTimes(queryTimes) {
        var _a;
        const templateToResultTimings = {};
        for (const row of queryTimes.data) {
            templateToResultTimings[_a = row.name] ?? (templateToResultTimings[_a] = {
                timestamps: [],
                timeElapsed: [],
                timeOut: []
            });
            const timedOut = row.error === 'true';
            templateToResultTimings[row.name].timeOut.push(timedOut);
            if (row.time !== undefined) {
                if (row.time === '0' && timedOut) {
                    templateToResultTimings[row.name].timestamps.push([NaN]);
                    templateToResultTimings[row.name].timeElapsed.push([NaN]);
                }
                else {
                    templateToResultTimings[row.name].timestamps.push(row.timestamps.split(' ').map((x) => Number(x)));
                    templateToResultTimings[row.name].timeElapsed.push(row.times.split(' ').map((x) => Number(x)));
                }
            }
        }
        return templateToResultTimings;
    }
}
exports.DataIngestor = DataIngestor;
//# sourceMappingURL=DataIngestor.js.map