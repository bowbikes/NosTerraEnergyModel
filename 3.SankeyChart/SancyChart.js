function SankeyChart({
  nodes, // an iterable of node objects (typically [{id}, …]); implied by links if missing
  links // an iterable of link objects (typically [{source, target}, …])
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
  colors = colorScale, // array of colors
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
  const sankey = d3
      .sankey()
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

  //var totalNodes = _view === "Consumption" ? 16 : 17;
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
      if(_mode==='Verbose'){
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
  
  if (_mode === "Verbose") Labels.append("tspan")
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
          if ((d.y1-d.y0 > nodeValsm && _mode !== "Verbose") || (d.y1-d.y0 > nodeVal && _mode === "Verbose")) return 'white';
        }
        return 'black';
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => _view === "Consumption" ? String(d.value.toFixed(2)) + " Quads" 
                                         : _view === "Emissions" ? String(d.value.toFixed(2)) + " Mt CO2" 
                                         : "$"+String(d.value.toFixed(2)) + "B");

  const linkVal = 10;
  
  if (_mode === "Verbose") svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(links)
    .join("text")
    //X shift data
    .attr("x", d => {
      /// for some reason this if isnt triggering
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
          .data(_summaryText)
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
