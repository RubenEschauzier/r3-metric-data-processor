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
        const templateToDiefficiency = {};
        for (const template of Object.keys(relevantDocuments)) {
            console.log(template);
            const templateMetrics = await this.calculateDiEfficiencyTemplate(topologies[template], relevantDocuments[template]);
            templateToDiefficiency[template] = templateMetrics;
        }
        return templateToDiefficiency;
    }
    async calculateDiEfficiencyTemplate(topologies, relevantDocuments) {
        const templateMetrics = [];
        for (let i = 0; i < relevantDocuments.length; i++) {
            const queryMetrics = [];
            for (let j = 0; j < relevantDocuments[i].length; j++) {
                if (topologies[i][j] === undefined) {
                    console.log(topologies.length);
                    console.log(topologies[i].length);
                    console.log(relevantDocuments.length);
                    console.log(relevantDocuments[i].length);
                }
                const relevanDocumentsAsIndex = relevantDocuments[i][j].map(x => {
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
                if (relevanDocumentsAsIndex.length === 0) {
                    queryMetrics.push(-1);
                }
                else {
                    const timestamps = this.getRetrievalTimestamps(topologies[i][j], relevanDocumentsAsIndex, 'event');
                    queryMetrics.push(this.calculateDiEfficiency(timestamps, relevanDocumentsAsIndex.length));
                }
            }
            templateMetrics.push(queryMetrics);
        }
        return templateMetrics;
    }
    calculateDiEfficiency(timestamps, nResults) {
        const output = di.DiEfficiencyMetric.answerDistributionFunction(timestamps, 1000);
        const dieff = di.DiEfficiencyMetric.defAtK(nResults, output.answerDist, output.linSpace);
        return dieff;
    }
    getRetrievalTimestamps(topology, relevantDocuments, tsType) {
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
                        if (tsType === 'time') {
                            // TODO get timestamp from topology dereference metadata and put it in here
                        }
                        if (tsType == 'event') {
                            // At traversal step i have we found a new result
                            eventTimestamps.push(i);
                        }
                    }
                }
            }
        }
        return eventTimestamps;
    }
    getAnswerDistribution(retrievalTimestamps) {
        const distFunction = di.DiEfficiencyMetric.answerDistributionFunction(retrievalTimestamps, 1000);
    }
    getResultRetrievalDistribution() {
    }
}
exports.DiefficiencyMetricExperiment = DiefficiencyMetricExperiment;
//# sourceMappingURL=DiefficiencyMetric.js.map