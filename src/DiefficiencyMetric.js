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
exports.DiefficiencyMetricExperiment = void 0;
const di = __importStar(require("diefficiency"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DiefficiencyMetricExperiment {
    constructor(data) {
        this.benchmarkData = data;
    }
    async run() {
        const experimentOutputs = {};
        for (const experiment of Object.keys(this.benchmarkData)) {
            console.log(`Calculating for ${experiment}`);
            const templateMetrics = await this.calculateDiEfficiencyExperiment(this.benchmarkData[experiment]);
            experimentOutputs[experiment] = templateMetrics;
        }
        return experimentOutputs;
    }
    async calculateDiEfficiencyExperiment(experimentData) {
        const relevantDocuments = experimentData.templateToRelevantDocuments;
        const topologies = experimentData.templateToTopologies;
        const resultTimestamps = experimentData.templateToTimings;
        const templateToDiefficiency = {};
        for (const template of Object.keys(relevantDocuments)) {
            console.log(template);
            const templateMetrics = await this.calculateDiEfficiencyTemplate(topologies[template], relevantDocuments[template], resultTimestamps[template]);
            templateToDiefficiency[template] = templateMetrics;
        }
        return templateToDiefficiency;
    }
    async calculateDiEfficiencyTemplate(topologies, relevantDocuments, resultTimestamps) {
        const templateRetrievalDieff = [];
        const templateResultDieff = [];
        const templateExecutionTimes = [];
        for (let i = 0; i < relevantDocuments.length; i++) {
            // const queryRetrievalDieff: IDieffOutput[] = [];
            const queryRetrievalTimestamps = [];
            for (let j = 0; j < relevantDocuments[i].length; j++) {
                if (topologies[i][j] === undefined) {
                    console.log(topologies.length);
                    console.log(topologies[i].length);
                    console.log(relevantDocuments.length);
                    console.log(relevantDocuments[i].length);
                }
                const relevantDocumentsAsIndex = relevantDocuments[i][j].map(x => {
                    return x.map(y => {
                        const indexedNode = topologies[i][j].nodeToIndex[y];
                        if (indexedNode === undefined) {
                            console.log(topologies[i][j].nodeToIndex);
                            console.log(`Node: ${y} not in node to index for i,j,y${[i, j, y]}`);
                        }
                        return indexedNode;
                    });
                });
                // In case there are no relevant documents, the query timed out so diefficiency cant be computed
                if (relevantDocumentsAsIndex.length > 0) {
                    const timestamps = this.getRetrievalTimestamps(topologies[i][j], relevantDocumentsAsIndex);
                    queryRetrievalTimestamps.push(timestamps.zerodEventTimestamps);
                    // queryRetrievalDieff.push(this.calculateDiEfficiency(
                    //     timestamps.zerodEventTimestamps, 
                    //     relevantDocumentsAsIndex.length
                    // ));
                }
            }
            if (queryRetrievalTimestamps.length === 0) {
                templateRetrievalDieff.push({
                    answerDistributionFunction: [-1],
                    dieff: -1,
                    linSpace: [-1]
                });
            }
            else {
                const averagedTimestamps = this.elementwiseMean(queryRetrievalTimestamps)
                    .sort(function (a, b) { return a - b; });
                const dieffRetrieval = this.calculateDiEfficiency(averagedTimestamps, averagedTimestamps.length);
                templateRetrievalDieff.push(dieffRetrieval);
            }
            if (resultTimestamps.timestamps[i][0] == Number.NaN) {
                templateResultDieff.push({ answerDistributionFunction: [-1], dieff: -1, linSpace: [-1] });
                templateExecutionTimes.push(Number.NaN);
            }
            else {
                const dieffResults = this.calculateDiEfficiency(resultTimestamps.timestamps[i], resultTimestamps.timestamps[i].length);
                templateResultDieff.push(dieffResults);
                const queryTemplateElapsedTimes = resultTimestamps.timeElapsed[i];
                templateExecutionTimes.push(queryTemplateElapsedTimes
                    .reduce((acc, val) => acc + val, 0) / queryTemplateElapsedTimes.length);
            }
        }
        return {
            retrievalDieff: templateRetrievalDieff,
            resultDieff: templateResultDieff,
            totalExecutionTime: templateExecutionTimes
        };
    }
    calculateDiEfficiency(timestamps, nResults) {
        const output = di.DiEfficiencyMetric.answerDistributionFunction(timestamps, 10000);
        const dieff = di.DiEfficiencyMetric.defAtK(nResults, output.answerDist, output.linSpace);
        return { answerDistributionFunction: output.answerDist, dieff: dieff, linSpace: output.linSpace };
    }
    elementwiseMean(data) {
        let maxLenghtArray = 0;
        for (let k = 0; k < data.length; k++) {
            if (data[k].length > maxLenghtArray) {
                maxLenghtArray = data[k].length;
            }
        }
        const means = [];
        for (let i = 0; i < maxLenghtArray; i++) {
            let totalAtI = 0;
            let nAtI = 0;
            for (let j = 0; j < data.length; j++) {
                if (data[j][i]) {
                    totalAtI += data[j][i];
                    nAtI++;
                }
            }
            means.push(totalAtI / nAtI);
        }
        return means;
    }
    getRetrievalTimestamps(topology, relevantDocuments) {
        const engineTraversalPath = topology.dereferenceOrder;
        // Iterate over engine traversal path, update to visit for result, after update check if new list is empty
        // if it is empty we have +1 result
        const eventTimestamps = [];
        const progressUntillResult = {};
        for (let i = 0; i < relevantDocuments.length; i++) {
            progressUntillResult[i] = relevantDocuments[i];
        }
        const traversalUntillAllVisited = [];
        for (let i = 0; i < engineTraversalPath.length; i++) {
            const newVisitedNode = engineTraversalPath[i];
            traversalUntillAllVisited.push(newVisitedNode);
            // Edge denotes traversal to second element of edge, so we only check if second element
            // Is a relevant node
            for (let j = 0; j < relevantDocuments.length; j++) {
                if (progressUntillResult[j].includes(newVisitedNode[1])) {
                    const nodes = [...progressUntillResult[j]];
                    // Remove currently found document
                    nodes.splice(nodes.indexOf(newVisitedNode[1]), 1);
                    progressUntillResult[j] = nodes;
                    if (progressUntillResult[j].length === 0) {
                        const nodeMetadata = topology.nodeMetadata[newVisitedNode[1]];
                        if (nodeMetadata.dereferenceTimestamp) {
                            eventTimestamps.push(nodeMetadata.dereferenceTimestamp);
                        }
                        else {
                            // some instances (like short-4) use the seed document as source
                            // In this case there is no dereference timestamp (oops), 
                            // but dereference = discover timestamp
                            eventTimestamps.push(nodeMetadata.discoverTimestamp);
                        }
                    }
                }
            }
        }
        // Zero the timestamps by taking the first discover timestamp as first timestamp
        let firstDiscoverTimestamp = 0;
        let i = 0;
        while (firstDiscoverTimestamp === 0) {
            const metadata = topology.nodeMetadata[i];
            if (metadata.discoverTimestamp) {
                firstDiscoverTimestamp = metadata.discoverTimestamp;
            }
            i++;
        }
        const zerodEventTimestamps = eventTimestamps.map(x => x - firstDiscoverTimestamp)
            .sort(function (a, b) { return a - b; });
        return { zerodEventTimestamps, firstDiscoverTimestamp };
    }
    static writeToFile(data, outputLocation) {
        for (const combination of Object.keys(data)) {
            fs.writeFileSync(path.join(outputLocation, `dieff-${combination}.json`), JSON.stringify(data[combination]));
        }
    }
}
exports.DiefficiencyMetricExperiment = DiefficiencyMetricExperiment;
//# sourceMappingURL=DiefficiencyMetric.js.map