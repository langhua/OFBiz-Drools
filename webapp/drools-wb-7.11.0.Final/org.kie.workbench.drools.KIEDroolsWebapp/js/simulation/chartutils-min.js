function simChartSetProcessAveragesLabels(a,b){a.key=b.View.sim.chartsProcessAverages;
if(a.values&&a.values.length==3){a.values[0].label=b.View.sim.chartsMaxExecutionTime;
a.values[1].label=b.View.sim.chartsMinExecutionTime;
a.values[2].label=b.View.sim.chartsAvgExecutionTime
}}function simChartSetMinMaxAvgLabels(a,b){if(a&&a.length==3){a[0].label=b.View.sim.chartsMax;
a[1].label=b.View.sim.chartsMin;
a[2].label=b.View.sim.chartsAverage
}};