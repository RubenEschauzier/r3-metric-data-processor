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
const ingestor = new DataIngestor_1.DataIngestor(path.join(__dirname, "..", "data", "output"));
const processedData = ingestor.read();
const r3MetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "r3-metrics");
const dieffMetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "dieff-metrics");
const oracelOutputDir = path.join(__dirname, "..", "data", "processed-data");
const r3Metric = new R3Metric_1.R3Metric();
const diMetric = new DiefficiencyMetric_1.DiefficiencyMetricExperiment();
async function calculateMetrics(data) {
    const r3MetricOutput = {};
    const dieffOutput = {};
    for (let { experiment, experimentOutput } of data) {
        const r3Result = await r3Metric.run(experiment, experimentOutput);
        const dieffResult = await diMetric.run(experiment, experimentOutput);
        r3MetricOutput[experiment] = r3Result;
        dieffOutput[experiment] = dieffResult;
        // experimentOutput = undefined as unknown as IExperimentReadOutput;    
    }
    // DiefficiencyMetricExperiment.writeToFile(dieffOutput, dieffMetricOutputDir);
    // R3Metric.writeToFile(r3MetricOutput, r3MetricOutputDir);
}
calculateMetrics(processedData);
//# sourceMappingURL=process.js.map