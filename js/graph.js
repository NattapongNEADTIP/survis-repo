function createGraph(data) {
  const width = document.getElementById('chart').clientWidth;
  const height = document.getElementById('chart').clientHeight;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const container = svg.append("g");

  let nodes = [], links = [], nodeMap = {};

  data.papers.forEach(paper => {
    const paperNode = { id: paper.id, group: 'paper' };
    nodes.push(paperNode);
    nodeMap[paper.id] = paperNode;

    if (paper.dataset) {
      paper.dataset.forEach(ds => {
        if (!nodeMap[ds]) {
          nodeMap[ds] = { id: ds, group: 'dataset' };
          nodes.push(nodeMap[ds]);
        }
        links.push({ source: paper.id, target: ds });
      });
    }

    if (paper.feature_selection_methods) {
      paper.feature_selection_methods.forEach(fs => {
        if (!nodeMap[fs]) {
          nodeMap[fs] = { id: fs, group: 'feature_selection' };
          nodes.push(nodeMap[fs]);
        }
        links.push({ source: paper.id, target: fs });
      });
    }

    if (paper.classifiers) {
      paper.classifiers.forEach(clf => {
        if (!nodeMap[clf]) {
          nodeMap[clf] = { id: clf, group: 'classifier' };
          nodes.push(nodeMap[clf]);
        }
        links.push({ source: paper.id, target: clf });
      });
    }

    if (paper.best_result) {
      paper.best_result.forEach(item => {
        Object.keys(item).forEach(key => {
          const value = item[key];
          if (typeof value === 'string') {
            if (!nodeMap[key]) {
              nodeMap[key] = { id: key, group: 'feature_selection' };
              nodes.push(nodeMap[key]);
            }
            if (!nodeMap[value]) {
              nodeMap[value] = { id: value, group: 'classifier' };
              nodes.push(nodeMap[value]);
            }
            links.push({ source: key, target: value, best: true });
          } else if (typeof value === 'object') {
            Object.keys(value).forEach(innerKey => {
              const innerValue = value[innerKey];
              if (!nodeMap[innerKey]) {
                nodeMap[innerKey] = { id: innerKey, group: 'feature_selection' };
                nodes.push(nodeMap[innerKey]);
              }
              if (!nodeMap[innerValue]) {
                nodeMap[innerValue] = { id: innerValue, group: 'classifier' };
                nodes.push(nodeMap[innerValue]);
              }
              links.push({ source: innerKey, target: innerValue, best: true });
            });
          }
        });
      });
    }
  });

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2.6));

  const link = container.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", 2)
    .attr("stroke", d => d.best ? "red" : "#aaa")
    .attr("stroke-dasharray", d => d.best ? "5,5" : "0");

  const node = container.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("r", 8)
    .attr("fill", d => {
      if (d.group === 'paper') return "#1f77b4";
      if (d.group === 'dataset') return "gold";
      if (d.group === 'feature_selection') return "lightgreen";
      if (d.group === 'classifier') return "violet";
      return "#ccc";
    })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  node.append("title").text(d => d.id);

  const label = container.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(nodes)
    .enter().append("text")
    .attr("dy", -10)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(d => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}
