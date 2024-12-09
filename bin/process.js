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
const path = __importStar(require("path"));
const DataIngestor_1 = require("../src/DataIngestor");
const R3Metric_1 = require("../src/R3Metric");
const DiefficiencyMetric_1 = require("../src/DiefficiencyMetric");
const ingestor = new DataIngestor_1.DataIngestor(path.join(__dirname, "..", "data", "output-temp"));
const processedData = ingestor.read();
const r3MetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "r3-metric");
const dieffMetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "dieff-metrics");
const r3Metric = new R3Metric_1.R3Metric(processedData);
const diMetric = new DiefficiencyMetric_1.DiefficiencyMetricExperiment(processedData);
// diMetric.run().then(x => {
//     DiefficiencyMetricExperiment.writeToFile(x, dieffMetricOutputDir)
//     console.log(x)
//     // R3Metric.writeToFile(x, metricOutputDir);
// });
r3Metric.run().then(x => {
    console.log(JSON.stringify(x));
    // R3Metric.writeToFile(x, metricOutputDir);
});
//# sourceMappingURL=process.js.map