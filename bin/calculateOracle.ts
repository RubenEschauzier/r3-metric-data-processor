import * as path from 'path';
import { DataIngestor, IDataIngested, IExperimentReadOutput } from '../src/DataIngestor';
import { ITemplateR3Metric, R3Metric } from '../src/R3Metric';
import { DiefficiencyMetricExperiment, ITemplateDieff } from '../src/DiefficiencyMetric';
import * as fs from 'fs';

const ingestor = new DataIngestor(path.join(__dirname, "..", "data", "output"));
const processedData = ingestor.read();

const oracleOutputDir = path.join(__dirname, "..", "data", "oracle", "output");


async function calculateMetrics(data: Generator<IDataIngested>){
    for (let {experiment, experimentOutput} of data){
        
    }
}
calculateMetrics(processedData);
