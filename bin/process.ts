import * as path from 'path';
import { DataIngestor } from '../src/DataIngestor';
import { R3Metric } from '../src/R3Metric';
import { DiefficiencyMetricExperiment } from '../src/DiefficiencyMetric';
import * as fs from 'fs';

const ingestor = new DataIngestor(path.join(__dirname, "..", "data", "output"));
const processedData = ingestor.read();

const r3MetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "r3-metrics");
const dieffMetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "dieff-metrics");
const oracelOutputDir = path.join(__dirname, "..", "data", "processed-data");

const r3Metric = new R3Metric(processedData);
const diMetric = new DiefficiencyMetricExperiment(processedData);
diMetric.run().then(x => {
    DiefficiencyMetricExperiment.writeToFile(x, dieffMetricOutputDir)
    r3Metric.run().then(x => {
        R3Metric.writeToFile(x, r3MetricOutputDir);
    });    
});


fs.writeFileSync(
    path.join(oracelOutputDir, 'oracleData.json'), 
    JSON.stringify(processedData['combination_0'].oracleRccValues)
);

