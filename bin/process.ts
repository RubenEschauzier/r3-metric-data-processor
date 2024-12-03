import * as path from 'path';
import { DataIngestor } from '../src/DataIngestor';
import { R3Metric } from '../src/R3Metric';
import { DiefficiencyMetricExperiment } from '../src/DiefficiencyMetric';

const ingestor = new DataIngestor(path.join(__dirname, "..", "data", "output"));
const processedData = ingestor.read();

const metricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics");
const r3Metric = new R3Metric(processedData);
const diMetric = new DiefficiencyMetricExperiment(processedData);
diMetric.run().then(x => {
    console.log(x)
    // R3Metric.writeToFile(x, metricOutputDir);
});

// metric.run().then(x => {
//     R3Metric.writeToFile(x, metricOutputDir);
// });

