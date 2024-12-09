import * as path from 'path';
import { DataIngestor } from '../src/DataIngestor';
import { R3Metric } from '../src/R3Metric';
import { DiefficiencyMetricExperiment } from '../src/DiefficiencyMetric';

const ingestor = new DataIngestor(path.join(__dirname, "..", "data", "output-temp"));
const processedData = ingestor.read();

const r3MetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "r3-metric");
const dieffMetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "dieff-metrics");

const r3Metric = new R3Metric(processedData);
const diMetric = new DiefficiencyMetricExperiment(processedData);
// diMetric.run().then(x => {
//     DiefficiencyMetricExperiment.writeToFile(x, dieffMetricOutputDir)
//     console.log(x)
//     // R3Metric.writeToFile(x, metricOutputDir);
// });

r3Metric.run().then(x => {
    // R3Metric.writeToFile(x, metricOutputDir);
});

