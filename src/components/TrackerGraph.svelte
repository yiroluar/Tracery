<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import { trackerStore, trackerActions } from '@stores/trackerStore';
  
  let svgElement: SVGSVGElement;
  let simulation: d3.Simulation<any, undefined>;
  
  $: nodes = $trackerStore.nodes;
  
  onMount(() => {
    if (nodes.length > 0) {
      initializeGraph();
    }
  });
  
  onDestroy(() => {
    if (simulation) {
      simulation.stop();
    }
  });
  
  $: if (nodes.length > 0 && svgElement) {
    updateGraph();
  }
  
  function initializeGraph() {
    const svg = d3.select(svgElement);
    const width = 360;
    const height = 320;
    
    svg.selectAll('*').remove();
    
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    
    svg.call(zoom as any);
    
    const container = svg.append('g').attr('class', 'zoom-container');
    
    simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-300).distanceMax(200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(15))
      .alphaDecay(0.05)
      .alphaMin(0.01);
    
    updateGraph();
  }
  
  function updateGraph() {
    if (!svgElement || !simulation) return;
    
    const svg = d3.select(svgElement);
    const container = svg.select('.zoom-container');
    
    const nodeGroups = container.selectAll('.node-group')
      .data(nodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');
    
    nodeGroups.selectAll('circle').remove();
    nodeGroups.append('circle')
      .attr('r', (d: any) => {
        switch(d.threatLevel) {
          case 'critical': return 12;
          case 'high': return 10;
          default: return 8;
        }
      })
      .attr('fill', '#000')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    nodeGroups.selectAll('text').remove();
    nodeGroups.append('text')
      .text((d: any) => d.id.length > 20 ? d.id.substring(0, 17) + '...' : d.id)
      .attr('font-size', '9px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('dx', 12)
      .attr('dy', 3)
      .attr('fill', '#ffffff')
      .style('pointer-events', 'none');
    
    const dragBehavior = d3.drag()
      .on('start', function(event, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).raise();
      })
      .on('drag', function(event, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d: any) {
        if (!event.active) simulation.alphaTarget(0);
      });
    
    nodeGroups
      .call(dragBehavior as any)
      .on('click', function(event, d: any) {
        event.stopPropagation();
        trackerActions.toggleTracker(d.id);
      });
    
    simulation.nodes(nodes);
    simulation.on('tick', () => {
      nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    simulation.restart();
  }
</script>

<div class="flex-1 bg-black">
  <svg 
    bind:this={svgElement}
    width="360" 
    height="320"
    class="w-full h-full"
  ></svg>
</div>