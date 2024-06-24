<div id="sankey-chart"></div>
<script>
document.addEventListener('DOMContentLoaded', function() {
window.fetchDataAndUpdateChart = function() {
  return new Promise((resolve,reject) => {
  //window._scen === null ? 181 : window._scen;
  //window._year === null ? 2022 : window._year;
  //window._view === null ? "Consumption" : window._view;
  //window._mode === null ? "Graphical" : window._mode;
  const baseUrl = `https://sankeydata.s3.amazonaws.com/scen_${window._scen}/${window._year}/`;
  
  console.log('base URL is ', baseUrl)
  Promise.all([
    d3.json(baseUrl + window._view + '/nodes.json'),
    d3.json(baseUrl + window._view + '/links.json'),
    d3.json(baseUrl.slice(0, -5) + 'ScenarioSummaryTotals.json')
    // Add other necessary files if there are more than these two
  ]).then(function([_nodeData, _linkData, _summaryData]) {
    // Attach to the global window object
    window.globalNodeData = _nodeData;
    window.globalLinkData = _linkData;
    window.globalSummaryData = _summaryData;
    // Assuming you have a function to update the chart with new data
    const colorScale = globalNodeData.data.map(node => node.Color);
    window.globalColorScale = colorScale;
    resolve();
  }).catch(error => {
    console.error('Fetching error: ', error);
    reject(error);
   });
 });
};

window.fetchDataAndUpdateChart().then(() => {
    console.log("Fetch completed, now running loadDataAndProcess");
    loadDataAndProcess(); // Make sure this call is within or after the promise resolution
  });

async function loadDataAndProcess() {
  try {
    await window.fetchDataAndUpdateChart();
    // variables
    const _linkData = window.globalLinkData;
    const _nodeData = window.globalNodeData;
    const _summaryData = window.globalSummaryData;
    //window._view = document.getElementById('window._view');
   // window._year = document.getElementById('window._year');
   // window._scen = document.getElementById('window._scen');
   // window._mode = document.getElementById('window._mode');
    const colorScale = window.globalColorScale;
  } catch (error) {
    console.error("Could not load data:", error);
  }
}
});
</script>
<script>
const _nodeShift = [{
     'Grid': 0.0,
     'Residential': 0.5,
     'Commercial': 0.6,
     'Industrial': 0.7,
     'Transportation': 0.85,
     'Rejected Energy': 0.35,
     'Energy Services': 0.7,
     'Total Emissions': 0.3,
     'Total Cost': 0.3
}]

const _height = 400;
const _width = 1400;
const _itterations = 120;
const startKneeOffset = 90;
const _layerValEntry = 190;
const _layerValExit = 95;
const endKneeOffset = 115;
const r = 55;
const _nodeWidth = 80;
const linkOpacity = 97;
const _padding = 30;
const linkThreshold = 0.02;
  // helper functions (straightLine, linkSort, drawSort)
function straightLine(d) {
  const startKnee = 
    d.y0 <= _height/2
      ? startKneeOffset + (d.source.y0-d.y0) + (_layerValEntry*((d.target.layer-d.source.layer)-1))
      : startKneeOffset - (d.source.y0-d.y0) + (_layerValEntry*((d.target.layer-d.source.layer)-1));
  // maybe fix some of this with a layer amount
  const endKnee = 
    d.y1 <= _height/2
      ? d.target.id === 'Rejected Energy'
        ? (endKneeOffset + (d.target.y0-d.y1)) + 50 + (_layerValExit*((d.target.layer-d.source.layer)-1))
        : (endKneeOffset + (d.target.y0-d.y1)) + (_layerValExit*((d.target.layer-d.source.layer)-1))
      : d.target.id === 'Energy Services'
        ? (endKneeOffset - (d.target.y0-d.y1)) - 50 + (_layerValExit*((d.target.layer-d.source.layer)-1))
        : (endKneeOffset - (d.target.y0-d.y1)) + (_layerValExit*((d.target.layer-d.source.layer)-1))
      //: d.target.id === 'Total Cost'
      //  ? (endKneeOffset - (d.target.y0-d.y1)) - 50 + (_layerValExit*((d.target.layer-d.source.layer)-1))
      //  : (endKneeOffset - (d.target.y0-d.y1)) + (_layerValExit*((d.target.layer-d.source.layer)-1))

  const returnArray = 
    d.source.id in _nodeShift[0]
      ? ['M', d.source.x1, d.y0 - (d.source.y0 - _height*_nodeShift[0][d.source.id]),
        'h', startKnee ,
        'C', 
        // Two control points for the curve
        d.source.x1 + startKnee+ r, d.y0 -(d.source.y0 - _height*_nodeShift[0][d.source.id])]
      : ['M', d.source.x1, d.y0,
      'h', startKnee ,
      'C', 
      // Two control points for the curve
      d.source.x1 + startKnee+ r, d.y0]

  if(d.target.id in _nodeShift[0]){
    return returnArray.concat([d.target.x0 - endKnee - r, d.y1- (d.target.y0 - _height*_nodeShift[0][d.target.id]),
      // Curve endpoint
      d.target.x0 - endKnee, d.y1- (d.target.y0 - _height*_nodeShift[0][d.target.id]),
      'h', endKnee,
    ]).join(' ')
  }
  else{
    return returnArray.concat([d.target.x0 - endKnee - r, d.y1,
      // Curve endpoint
      d.target.x0 - endKnee, d.y1,
      'h', endKnee,
    ]).join(' ')
  } 
}

linkSort = (a, b) => {
  function targetIndex(target) {
    // Force grid to be sorted as first
    if (target === "Grid") return -1
    return globalNodeData.data.findIndex(node => node.id === target)
  }
  if (a.source === b.source) {
    return targetIndex(a.target.id) - targetIndex(b.target.id)
  }
  if (a.target === b.target) {
    return targetIndex(a.source.id) - targetIndex(b.source.id)
  }
}

drawSort = (a, b) => {
  if (a.target.id === "Rejected Energy" && a.source.id === "Grid")
    return 0;
  if (b.target.id === "Rejected Energy" && b.source.id === "Grid")
    return 0;
  if (a.target.id === "Rejected Energy" || a.source.id === "Grid")
    return -1;
  if (b.target.id === "Rejected Energy" || b.source.id === "Grid")
    return 1;
  if (a.target.id === "Energy Services")
    return 1
  if (b.target.id === "Energy Services")
    return -1
  if (a.source.id === "Natural Gas")
    return 1;
  if (b.source.id === "Natural Gas")
    return-1;
  else
    return 0;
}

function SankeyChart({
  nodes, // an iterable of node objects (typically [{id}, …]); implied by links if missing
  links, // an iterable of link objects (typically [{source, target}, …])
  summaryText, // an iterable of summary objects (typically aggregates)
  mode
}, {
  format = ",", // a function or format specifier for values in titles
  nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  nodeGroups, // an array of ordinal values representing the node groups
  nodeLabel, // given d in (computed) nodes, text to label the associated rect
  nodeTitle = d => `${d.id}\n${format(d.value)}`, // given d in (computed) nodes, hover text
  nodeAlign = d3.sankeyLeft, // Sankey node alignment strategy: left, right, justify, center
  nodeWidth = _nodeWidth, // width of node rects
  nodePadding = _padding, // vertical separation between adjacent nodes
  nodeLabelPadding = 5, // horizontal separation between node and label
  nodeStroke = "currentColor", // stroke around node rects
  nodeStrokeWidth, // width of stroke around node rects, in pixels
  nodeStrokeOpacity, // opacity of stroke around node rects
  nodeStrokeLinejoin, // line join for stroke around node rects
  linkSource = ({source}) => source, // given d in links, returns a node identifier string
  linkTarget = ({target}) => target, // given d in links, returns a node identifier string
  linkValue = ({value}) => value, // given d in links, returns the quantitative value
  linkPath = straightLine, // given d in (computed) links, returns the SVG path # working on this
  linkTitle = d => `${d.source.id} → ${d.target.id}\n${format(d.value)}`, // given d in (computed) links
  linkColor = 'layered', //"#aaa", // source, target, source-target, or static color
  linkStrokeOpacity = linkOpacity/100, // link stroke opacity
  colors = window.globalColorScale, // array of colors
  width = _width, // outer width, in pixels
  height = _height, // outer height, in pixels
  marginTop = 5, // top margin, in pixels
  marginRight = 1, // right margin, in pixels
  marginBottom = 5, // bottom margin, in pixels
  marginLeft = 1, // left margin, in pixels
} = {}) {
  // Compute values.
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  const LV = d3.map(links, linkValue);
  if (nodes === undefined) nodes = Array.from(d3.union(LS, LT), id => ({id}));
  const N = d3.map(nodes, nodeId).map(intern);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
  links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i], value: LV[i]}));
  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = G;

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
  // Compute the Sankey layout.
  const sankey = d3.sankey()
      .nodeId(({index: i}) => N[i])
      .nodeAlign(nodeAlign)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .nodeSort(null)
      .iterations(_itterations)
      .linkSort(linkSort)
      .extent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
      ({nodes, links});

  // Compute titles and labels using layout nodes, so as to access aggregate values.
  if (typeof format !== "function") format = d3.format(format);
  const Tl = nodeLabel === undefined ? N : nodeLabel == null ? null : d3.map(nodes, nodeLabel);
  const Tt = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const Lt = linkTitle == null ? null : d3.map(links, linkTitle);

  // A unique identifier for clip paths (to avoid conflicts).
  const uid = `O-${Math.random().toString(16).slice(2)}`;

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const link = svg.append("g")
      .attr("fill", "none")
      .selectAll("g")
      .data(links.sort(drawSort))
      .join("g")
      .attr("stroke-opacity",  d => {
        if (d.value <= linkThreshold) return 0;
        return linkStrokeOpacity;
      })

  var totalNodes = 16;
  
  link.append("path")
      .attr("d", linkPath)
      .attr("stroke", function(d) {
        if (linkColor === "layered") {
          // Use the color of the target node for the last two nodes
          if (d.target.index >= totalNodes - 2) {
            return color(G[d.target.index]);
          } else {
            // Use the color of the source node for other nodes
            return color(G[d.source.index]);
          }
        } else if (linkColor === "source-target") {
          return `url(#${uid}-link-${d.index})`;
        } else if (linkColor === "source") {
          return color(G[d.source.index]);
        } else if (linkColor === "target") {
          return color(G[d.target.index]);
        } else {
          // Handle other cases or default behavior here
          return linkColor;
        }
      })
      .attr("stroke-width", ({width}) => Math.max(1, width))
      .attr('stroke-linejoin', 'bevel')
      .call(Lt ? path => path.append("title").text(({index: i}) => Lt[i]) : () => {});

    const node = svg.append("g")
      .attr("stroke", nodeStroke)
      .attr("stroke-width", nodeStrokeWidth)
      .attr("stroke-opacity", 1)
      .attr("stroke-linejoin", nodeStrokeLinejoin)
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", d => d.x0)
      .attr('y', d => d.id in _nodeShift[0] ? _height*_nodeShift[0][d.id] : d.y0)
      .attr("height", d => d.y1 - d.y0,30)
      .attr("width", d => d.x1 - d.x0);
  
  if (G) node.attr("fill", ({index: i}) => color(G[i]));
  if (Tt) node.append("title").text(({index: i}) => Tt[i]);

  const nodeVal = 20;
  const nodeValsm = 10;
  
  const Labels = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(nodes)   
    .join("text")
    .attr("x", d => d.x0 + 34 + (d.layer * 2))
    .attr("y", d => {
      if(mode==='Verbose'){
        if (d.id === 'Grid') return ((d.y1 - d.y0) / 2);
        else if (d.y1-d.y0 <= nodeValsm ) {
          if (["Coal","Biomass","Petroleum"].includes(d.id)) return d.y0 - 20;
          return d.y1 + 8;
        }
        else if (d.y1-d.y0 > nodeVal) return d.id in _nodeShift[0] ? ((d.y1 - d.y0) / 2) - 5 +_height*_nodeShift[0][d.id] : ((d.y1 + d.y0) / 2) - 5;
          return d.id in _nodeShift[0] ? ((d.y1 - d.y0) / 2) +_height*_nodeShift[0][d.id] : (d.y1 + d.y0) / 2;
      }
      else {
        if (d.y1-d.y0 <= nodeValsm ) {
          if (d.id === 'Solar') return d.y1 + 8;
          return d.id in _nodeShift[0] ? _height*_nodeShift[0][d.id] -8 : d.y0-8;
        }
        return d.id in _nodeShift[0] ? ((d.y1 - d.y0)/2) +_height*_nodeShift[0][d.id] : (d.y1 + d.y0) / 2;
      }
    })
    .attr('fill', d => {if( d.value <linkThreshold) { return 'none'}
      else if (['Nuclear', 'Hydro', 'Wind', 'Geothermal', 'Coal', 'Petroleum', 'Energy Services'].includes(d.id)) {
        if (d.y1-d.y0 > nodeValsm ) return 'white';
      }
      return 'black';
    })
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(({ index: i }) => Tl[i]);
  
  if (mode === "Verbose") Labels.append("tspan")
      .attr("x", d => d.x0 + 34 + (d.layer * 2))
      .attr("y", d => {
        if (d.y1-d.y0 <= nodeValsm ) {
          if (["Coal","Biomass","Petroleum"].includes(d.id)) return d.y0 - 8;
          return d.id in _nodeShift[0] ? (d.y1 - d.y0) +_height*_nodeShift[0][d.id] + 20 : d.y1 + 20;
        }
        else if(d.y1-d.y0 <= nodeVal){
          if (["Coal","Biomass","Petroleum"].includes(d.id)) return d.y0 - 8;
          return d.id in _nodeShift[0] ? (d.y1 - d.y0) +_height*_nodeShift[0][d.id] +10 : d.y1 + 10;
        }
        if (d.id === 'Grid') return ((d.y1 - d.y0) / 2)+12;
        return d.id in _nodeShift[0] ? ((d.y1 - d.y0)/2) +_height*_nodeShift[0][d.id] + 6 : ((d.y1 + d.y0) / 2) + 6;
      })
      .attr('fill', d => {if( d.value <linkThreshold) { return 'none'}
        else if (['Nuclear', 'Hydro', 'Wind', 'Geothermal', 'Coal', 'Petroleum', 'Energy Services'].includes(d.id)) {
          if ((d.y1-d.y0 > nodeValsm && mode !== "Verbose") || (d.y1-d.y0 > nodeVal && mode === "Verbose")) return 'white';
        }
        return 'black';
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => window._view === "Consumption" ? String(d.value.toFixed(2)) + " Quads" 
                                         : window._view === "Emissions" ? String(d.value.toFixed(2)) + " Mt CO2" 
                                         : "$"+String(d.value.toFixed(2)) + "B");

  const linkVal = 10;
  
  if (mode === "Verbose") svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(links)
    .join("text")
    //X shift data
    .attr("x", d => {
     if (["Rejected Energy","Energy Services","Total Emissions","Total Cost"].includes(d.target.id)) {
        return d.source.id === "Grid"? ((d.target.x0 - d.source.x1 )/2) + d.source.x1
                                     : d.source.x1+16}
      else if (d.width > linkVal ) return d.target.x0 - 16;
      else if (["Residential","Commercial","Industrial","Transportation"].includes(d.target.id) && ["Grid","Petroleum"].includes(d.source.id)) 
        return d.target.x0 - 15;
      else if (["Nuclear","Hydro","Wind"].includes(d.source.id)) return d.source.x1 + 12;
      else if (d.source.id === "Geothermal"){
        if (d.y0 <= _height/2)
          return startKneeOffset + (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+50;
          return startKneeOffset - (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+50;}
      else if (d.source.id === "Solar"){
          return startKneeOffset - (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+100;}
      else if (d.source.id === "Natural Gas"){
        if (d.y0 <= _height/2)
          return startKneeOffset + (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+105;
          return startKneeOffset - (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+105;}        
      else if (d.y0 <= _height/2)
        return startKneeOffset + (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+85;
        return startKneeOffset - (d.source.y0-d.y0) + ((3/2)*(_layerValEntry*((d.target.layer-d.source.layer)-1)))+85;})
    //Y shift Data
    .attr("y", d => {if (d.width > linkVal) {
        if (d.target.id in _nodeShift[0] && d.source.id in _nodeShift[0]){
          if(d.source.id === "Grid"){
            return d.target.id === "Rejected Energy" ? ((d.y1 - d.target.y0 + _height*_nodeShift[0][d.target.id]) + (d.y0 - d.source.y0))/2 +10
                                                     : (d.y1 - d.target.y0 + _height*_nodeShift[0][d.target.id])
          }
          else {
            return d.y0 - d.source.y0 + _height*_nodeShift[0][d.source.id];
          }
        }
        if (d.source.id === "Petroleum") return d.y1 - d.target.y0 + _height*_nodeShift[0][d.target.id];
        if (!(d.source.id in _nodeShift[0])) return d.y1-d.target.y0 + _height*_nodeShift[0][d.target.id];
      }
      else if (d.source.id === "Hydro" || d.source.id === "Wind") return d.y0 - 8;
      else if (["Residential","Commercial","Industrial","Transportation"].includes(d.target.id) && ["Grid","Petroleum"].includes(d.source.id)) {
        if (d.source.id === "Grid" ) return d.y1-d.target.y0+_height*_nodeShift[0][d.target.id] - 7;
        if (d.source.id === "Petroleum") return d.y1 - d.target.y0 + _height*_nodeShift[0][d.target.id] + 7;
      }
      else if (d.target.id === "Rejected Energy") return d.y0-d.source.y0+_height*_nodeShift[0][d.source.id] - 10;
      else if (d.target.id === "Energy Services") return d.y0-d.source.y0+_height*_nodeShift[0][d.source.id] + 10;
      else if (d.target.id === "Grid") {if (d.y0 <= _height/2)
            if(d.y0 <10) return d.y0 + 10;
              return d.y0 - 14;
            if(d.y0>(_height-10)) return d.y0 - 14;
              return d.y0 + 10;}
      else if (d.source.id === "Natural Gas"){
          if (d.y1 <= _height/2)
            if (d.y0 <= height/2) return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.15)+d.y0;
              return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.15)+d.y0 - 10;
            return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.6)+d.y0 + 25;}
      else if (d.source.id === "Solar"){
            return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.2)+d.y0 -25;}
      else if (d.source.id === "Geothermal"){
          if (d.y1 <= _height/2)
            return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.7)+d.y0 - 3;
            return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.7)+d.y0 + 7;
      }
      else if (d.y1 <= _height/2)
            return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.75)+d.y0 - 10;
            return ((d.y1-d.target.y0+_height*_nodeShift[0][d.target.id]-d.y0)/1.75)+d.y0 + 10;})
    .attr('fill', d => {if(d.value > linkThreshold) {
        if(d.source.id === "Grid" && ["Rejected Energy","Total Cost","Total Emissions"].includes(d.target.id)) return "black";
        if (d.width > linkVal) {if (["Solar","Rejected Energy","Energy Services","Total Cost","Total Emissions"].includes(d.source.id)) return "black";
          return "white";}
        else if (["Coal","Solar","Rejected Energy","Energy Services","Total Cost","Total Emissions"].includes(d.source.id)) return "black";
        else if (d.target.index >= totalNodes - 2) {
            return color(G[d.target.index]);
          } else {
            // Use the color of the source node for other nodes
            return color(G[d.source.index]);
          }
      }
      return "none";
    })
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(d => String(d.value.toFixed(2)));

  var boxWidth = 220;
  var boxHeight = 50;
  var margin = 15;
  var boxX = width - boxWidth - margin;
  var boxY = margin;
  
  // Append a group for the box
  var boxGroup = svg.append("g")
                    .attr("transform", "translate(" + boxX + "," + boxY + ")");
  
  // Append rectangle for the box
  boxGroup.append("rect")
          .attr("width", boxWidth)
          .attr("height", boxHeight)
          .attr("fill", "lightblue")
          .attr("stroke", "black");
  
  // Append text elements
  boxGroup.selectAll("text")
          .data(summaryText)
          .enter()
          .append("text")
          .attr("x", boxWidth / 2)
          .attr("y", function(d, i) { return (i + 1) * 20; }) // Adjust spacing
          .attr("text-anchor", "middle")
          .text(function(d) { return d; });
  function intern(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  return Object.assign(svg.node(), {scales: {color}});
}  

// Assuming you have defined _nodeData, _linkData, etc., accordingly
document.addEventListener('DOMContentLoaded', function() {
  window.renderSankeyChart = function() {
    const chartContainer = document.getElementById('sankey-chart');
    chartContainer.innerHTML ='';
    // Ensure data has been loaded
    if (window.globalNodeData && window.globalLinkData) {
     // console.log(window._view)
     // console.log(window._year)
      const _summaryText = window._view === "Consumption"
       ? ["Emissions: "+String(window.globalSummaryData['data'][window._year-2021]['Emissions'])+' Mt C02',"Total Cost: $"+String(window.globalSummaryData['data'][window._year-2021]['Cost'])+'B']
       : window._view === "Emissions"
         ? ["Energy consumed: "+ String(window.globalSummaryData['data'][window._year-2021]['Consumption'])+' Quads',"Total Cost: $"+String(window.globalSummaryData['data'][window._year-2021]['Cost'])+'B']
         : ["Energy consumed: "+ String(window.globalSummaryData['data'][window._year-2021]['Consumption'])+' Quads',"Emissions: "+String(window.globalSummaryData['data'][window._year-2021]['Emissions'])+' Mt C02'];
      console.log("trying to draw chart")
      console.log(window.globalNodeData)
      const chart = SankeyChart({
        nodes: window.globalNodeData.data,
        links: window.globalLinkData.data,
        summaryText: _summaryText,
        mode: window._mode
      }, {
        nodeGroup: d => d.id.split(/\W/)[0],
        format: (f => d => `${f(d)} Quads`)(d3.format(",.1~f")),
        width: _width, // Ensure _width is defined
        height: _height // Ensure _height is defined
      });

      // Append the chart to the DOM
      chartContainer.appendChild(chart);
    } else {
      console.error("Data not loaded before attempting to render chart.");
    }
  }

  // Call fetchDataAndUpdateChart and wait for it to complete before rendering the chart
  window.fetchDataAndUpdateChart().then(window.renderSankeyChart).catch(error => {
    console.error("Error fetching data or rendering chart:", error);
  });
});
</script>
<style>
    #sankey-chart {
      border: 2px solid #00539B; /* Sets a solid border with a color of #333 (dark gray) */
      padding: 10px; /* Adds some space inside the border */
      margin: 20px; /* Adds space around the outside of the div */
      /*background-color: #f9f9f9; /* Light grey background for better visibility */
    }
</style>
