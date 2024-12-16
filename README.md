## Data Processor to Calculate $R^3$ Metric from Comunica Output

In this repository, we provide the code and links to other repositories used to produce the results for the paper titled: 

### Reproducing the Experiment of The Paper

In the paper, we benchmark 16 existing link prioritization algorithms. These prioritization algorithms are implemented in [comunica-feature-link-traversal](https://github.com/comunica/comunica-feature-link-traversal) on the following [branch](https://github.com/RubenEschauzier/comunica-feature-link-traversal/tree/feature/reimplement-prioritization). These algorithms are fully modular and primarily rely on systems implemented in the base Comunica engine. Example configurations are provided and can be recognised by the algorithm name. 

We provide two easy to reproduce [experiments](https://github.com/RubenEschauzier/link-prioritization-experiments/tree/master) used to produce the timing data and the $R^{3}$ and $DiefD$ data used in our paper.

### Reproducing the Calculation of the $R^3$ Metric and DiefD

To calculate the $R^3$ and $DiefD$ metric, an engine has the track the traversed topology, its dereference order, and why-provenance for results. We provide a modular configuration that tracks the required information and writes it to a file in a configurable directory on the following [branch](https://github.com/RubenEschauzier/comunica-feature-link-traversal/tree/feature/link-prioritization-r3-metric). This branch includes the prioritization algorithms used in the paper and the configurations required to run them and collect the $R^3$ and $DiefD$ data. In case you want to calculate the $R^3$ and $DiefD$ metrics for any other configuration, the following lines should be added to your config file.

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
Note that the `query-source-identify` configurations should replace the default `query-source-identify` configurations in Comunica. By adding this alternate version, bindings produced by Comunica are annotated with their source. Next, the `merge-bindings-context` configurations allow these source annotations to propegate through the joins. Finally, the `iterator-transform` and `query-operation` configurations allow Comunica to wrap intermediate solution producing streams, thus enabling us to record information about data flowing through Comunica. The actor added through `@graph` creates the file writers to record the information produced during query execution. Note that the `baseDirectoryExperiment` points to the directory the files will be written to.

### Processing the Output Data To Calculate the $R^{3}$, $Dief$, and $DiefD$ Metrics

The experiment to calculate the $R^{3}$, $Dief$, and $DiefD$ for the paper produces output in the following format: 

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
Simply paste this into the `/data` folder and run

```
node --max-old-space-size=8192 bin/process.js
```
The metric results will be produced in directory `/data/calculated-metrics` and the data used for the oracle algorithm will be produced in `/data/processed-data`.

### Creating the Visualizations from the Paper

