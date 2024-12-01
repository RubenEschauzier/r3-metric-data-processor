import * as path from 'path';
import { DataIngestor } from '../src/DataIngestor';
import { R3Metric } from '../src/R3Metric';

const ingestor = new DataIngestor(path.join(__dirname, "..", "data", "output"));
const processedData = ingestor.read();

const metricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics");
const metric = new R3Metric(processedData);
metric.run().then(x => {
    R3Metric.writeToFile(x, metricOutputDir);
});

