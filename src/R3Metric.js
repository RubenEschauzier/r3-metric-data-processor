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
exports.R3Metric = void 0;
const r3 = __importStar(require("comunica-experiment-performance-metric"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class R3Metric {
    constructor(data) {
        this.benchmarkData = data;
        this.metricCalculator = new r3.RunLinkTraversalPerformanceMetrics();
    }
    async run() {
        const experimentOutputs = {};
        for (const experiment of Object.keys(this.benchmarkData)) {
            console.log(`Calculating R3 for ${experiment}`);
            const templateMetrics = await this.calculateMetricExperiment(this.benchmarkData[experiment]);
            experimentOutputs[experiment] = templateMetrics;
        }
        return experimentOutputs;
    }
    async calculateMetricExperiment(experimentData) {
        const relevantDocuments = experimentData.templateToRelevantDocuments;
        const topologies = experimentData.templateToTopologies;
        const templateToR3 = {};
        for (const template of Object.keys(relevantDocuments)) {
            const templateMetrics = await this.calculateMetricTemplate(topologies[template], relevantDocuments[template]);
            templateToR3[template] = templateMetrics;
        }
        return templateToR3;
    }
    async calculateMetricTemplate(topologies, relevantDocuments) {
        const templateMetrics = {
            unweighted: [],
            http: []
        };
        for (let i = 0; i < relevantDocuments.length; i++) {
            const queryMetricsUnweighted = [];
            const queryMetricsHttp = [];
            for (let j = 0; j < relevantDocuments[i].length; j++) {
                if (topologies[i][j] === undefined) {
                    console.log(topologies.length);
                    console.log(topologies[i].length);
                    console.log(relevantDocuments.length);
                    console.log(relevantDocuments[i].length);
                }
                const numNodes = Object.keys(topologies[i][j].indexToNode).length;
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
                // In case there are no relevant documents, the query timed out so R3 can't be computed
                if (relevanDocumentsAsIndex.length === 0) {
                    queryMetricsUnweighted.push(-1);
                    queryMetricsHttp.push(-1);
                }
                else if (topologies[i][j].edgeList.length === 1) {
                    queryMetricsUnweighted.push(1);
                    queryMetricsHttp.push(1);
                }
                else {
                    const outputUnweighted = await this.metricCalculator.runMetricAll(topologies[i][j].edgeList, relevanDocumentsAsIndex, topologies[i][j].dereferenceOrder, topologies[i][j].seedDocuments, numNodes);
                    const outputHttp = await this.metricCalculator.runMetricAll(topologies[i][j].edgeListHttp, relevanDocumentsAsIndex, topologies[i][j].dereferenceOrderHttp, topologies[i][j].seedDocuments, numNodes);
                    queryMetricsUnweighted.push(outputUnweighted);
                    queryMetricsHttp.push(outputHttp);
                }
            }
            templateMetrics.unweighted.push(queryMetricsUnweighted);
            templateMetrics.http.push(queryMetricsHttp);
        }
        return templateMetrics;
    }
    static writeToFile(data, outputLocation) {
        for (const combination of Object.keys(data)) {
            fs.writeFileSync(path.join(outputLocation, `r3-${combination}.json`), JSON.stringify(data[combination]));
        }
    }
}
exports.R3Metric = R3Metric;
//# sourceMappingURL=R3Metric.js.map