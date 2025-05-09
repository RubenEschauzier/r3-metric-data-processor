import * as path from 'path';
import { DataIngestor, IDataIngested, IExperimentReadOutput } from '../src/DataIngestor';
import { ITemplateR3Metric, R3Metric } from '../src/R3Metric';
import { DiefficiencyMetricExperiment, ITemplateDieff } from '../src/DiefficiencyMetric';
import * as fs from 'fs';

const ingestor = new DataIngestor(path.join(__dirname, "..", "data", "output"));
const processedData = ingestor.read();

const r3MetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "r3-metrics");
const dieffMetricOutputDir = path.join(__dirname, "..", "data", "calculated-metrics", "dieff-metrics");
const oracelOutputDir = path.join(__dirname, "..", "data", "processed-data");

const r3Metric = new R3Metric();
const diMetric = new DiefficiencyMetricExperiment();

async function calculateMetrics(data: Generator<IDataIngested>){
    const r3MetricOutput: Record<string, Record<string, ITemplateR3Metric>> = {};
    const dieffOutput: Record<string, Record<string, ITemplateDieff>> = {};
    for (let {experiment, experimentOutput} of data){
        const r3Result = await r3Metric.run(experiment, experimentOutput);
        const dieffResult = await diMetric.run(experiment, experimentOutput);
        r3MetricOutput[experiment] = r3Result;
        dieffOutput[experiment] = dieffResult;            
    }
    DiefficiencyMetricExperiment.writeToFile(dieffOutput, dieffMetricOutputDir);
    R3Metric.writeToFile(r3MetricOutput, r3MetricOutputDir);

}
calculateMetrics(processedData);
