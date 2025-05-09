## Data Processor to Calculate $R^3$ Metric from Comunica Output

This repository provides the code and links to other repositories used to produce the results presented in the paper titled: 

**Revisiting Link Prioritization for Efficient Traversal in Structured Decentralized Environments**

### Reproducing the Experiments of the Paper

In the paper, we benchmark 16 existing link prioritization algorithms and one new one. These prioritization algorithms are implemented in [comunica-feature-link-traversal](https://github.com/comunica/comunica-feature-link-traversal) on this [branch](https://github.com/RubenEschauzier/comunica-feature-link-traversal/tree/feature/link-prioritization-r3-metric). The algorithms are fully modular and primarily rely on systems implemented in the base Comunica engine. Example configurations are provided and can be identified by the algorithm name.

We provide two easily reproducible [experiments](https://github.com/RubenEschauzier/link-prioritization-experiments/tree/master) that were used to generate the timing data as well as the $R^{3}$ and $DiefD$ metrics reported in the paper. The experiment on the master branch is used to obtain the timing results, while the experiment on the branch `experiment/r3-metric` is used to obtain the data required for the $R^{3}$ and $Dieff$ metrics.

### Reproducing the Calculation of the $R^3$ Metric and DiefD

To calculate the $R^3$ and $DiefD$ metrics, an engine must track the traversed topology, its dereference order, and why-provenance for results. We provide a modular configuration that tracks the required information and writes it to a file in a configurable directory on this [branch](https://github.com/RubenEschauzier/comunica-feature-link-traversal/tree/feature/link-prioritization-r3-metric). This branch includes the prioritization algorithms used in the paper and the configurations required to run them and collect the $R^3$ and $DiefD$ data. 

If you want to calculate the $R^3$ and $DiefD$ metrics for any other configuration, the following lines should be added to your config file.

```
"import": [
  
  "ccqs:config/iterator-transform/mediators.json",
  "ccqs:config/query-operation/actors/query/wrap-stream.json",
  "ccqslt:config/iterator-transform/actor-record-solutions.json",

  "ccqslt:config/merge-bindings-context/source-promise-union.json",
  "ccqs:config/merge-bindings-context/mediators.json",

  "ccqslt:config/query-source-identify/actors.json",
  "ccqs:config/query-source-identify/mediators.json",
  "ccqslt:config/query-source-identify/actors/hypermedia-quoted-triple-source-attribution.json",

]

"@graph": [
  {
    "@id": "urn:comunica:default:Runner",
    "@type": "Runner",
    "actors": [
      {
        "@id": "urn:comunica:default:context-preprocess/actors#set-r3-metric-tracking",
        "@type": "ActorContextPreprocessSetR3MetricTracking",
        "baseDirectoryExperiment": "file:///tmp/" (This should be a path to the directory you want to save the information to)
      }
    ]
  }
]
```
Note that the `query-source-identify` configurations should replace the default `query-source-identify` configurations in Comunica. By adding this alternate version, bindings produced by Comunica are annotated with their source. Next, the `merge-bindings-context` configurations allow these source annotations to propagate through the joins. Finally, the `iterator-transform` and `query-operation` configurations allow Comunica to wrap intermediate solution-producing streams, thus enabling us to record information about data flowing through Comunica. The actor added via `@graph` creates file writers to record information generated during query execution. Note that the `baseDirectoryExperiment` specifies the directory where the files will be written.

### Processing the Output Data To Calculate the $R^{3}$, $Dief$, and $DiefD$ Metrics

The experiment to calculate the $R^{3}$, $Dief$, and $DiefD$ metrics for the paper produces output in the following format: 

```
output/
├── combination_0/
│   └── interactive-discover-1
│        └── ....
│   └── ...
│   └── interactive-short-1
├── combination_1/
    └── interactive-discover-1
│       └── ....
│   └── ...
│   └── interactive-short-1
└── ...
```
Simply paste this into the `/data` folder and run:

```
node --max-old-space-size=8192 bin/process.js
```

The metric results will be produced in the directory `data/calculated-metrics`, and the data used for the oracle algorithm will be produced in `data/processed-data`. 

If you want to manually calculate the $R^{3}$ metric, use the following [repository](https://github.com/RubenEschauzier/Relevant-Retrieval-Ratio).

### Creating the Visualizations from the Paper

The figures from the paper can be recreated using the following Python [repository](https://github.com/RubenEschauzier/Visualize-R3-Metric-Data). To recreate the timing-related plots, paste the timing experiment output into the `data` folder. The expected format is as follows:

```
timings/
├── combination_0/
│   └── ...
│   └── query-times.csv
├── combination_1/
│   └── ...
│   └── query-times.csv
└── ...
```

Then, run the `create_timings_plot.py` file, and it will save the plots to `output/plots/`. The same applies to the $R^{3}$ metrics; however, this expects the data resulting from calculating the $R^3$ metric using this repository to be placed in the `data/r3-data/` folder. The content of r3-data should be the same as the content in `data/calculated-metrics/r3-metrics` after running `process.js` in this repository.

To create the table showing the percentage of queries that are 10% better or worse than `breadth-first` traversal, run `create_better_worse_tables.py`.
