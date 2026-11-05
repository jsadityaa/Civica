(() => {
  const loading = document.querySelector('#precinct-loading');
  const buttons = [...document.querySelectorAll('.precinct-map-controls button')];
  const load = document.createElement('script');
  load.src = './ohio-precinct-boundaries.js';
  load.onerror = () => { loading.textContent = 'Ohio’s boundary map could not load. Refresh the page to try again.'; };
  load.onload = () => {
    try {
      if (!window.d3) throw new Error('Map library unavailable');
      const data = window.OHIO_PRECINCT_BOUNDARIES;
      const svg = d3.select('#ohio-precinct-map');
      svg.attr('viewBox', data.viewBox).attr('hidden', null);
      const viewport = svg.append('g');
      const art = viewport.append('g').attr('transform', data.transform);
      for (const group of data.groups) {
        art.append('g').attr('transform', group.transform).selectAll('path')
          .data(group.paths).join('path').attr('class', 'precinct-boundary-shape').attr('d', d => d);
      }
      // Fit the artwork rather than preserving the source SVG's unused margins.
      const box = art.node().getBBox();
      const pad = Math.max(box.width, box.height) * .035;
      const extent = [[box.x - pad, box.y - pad], [box.x + box.width + pad, box.y + box.height + pad]];
      svg.attr('viewBox', `${extent[0][0]} ${extent[0][1]} ${box.width + pad * 2} ${box.height + pad * 2}`);
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
      const zoom = d3.zoom().extent(extent).scaleExtent([1, 16]).translateExtent(extent)
        .on('zoom', event => {
          viewport.attr('transform', event.transform);
          document.querySelector('#precinct-zoom-level').textContent = `${Math.round(event.transform.k * 100)}%`;
        });
      svg.call(zoom);
      const animate = () => svg.transition().duration(motion);
      const scale = amount => animate().call(zoom.scaleBy, amount);
      document.querySelector('#precinct-zoom-in').onclick = () => scale(1.6);
      document.querySelector('#precinct-zoom-out').onclick = () => scale(1 / 1.6);
      document.querySelector('#precinct-reset').onclick = () => animate().call(zoom.transform, d3.zoomIdentity);
      svg.on('keydown', event => {
        if (['+', '=', '-', '0', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
        if (['+', '='].includes(event.key)) scale(1.6);
        else if (event.key === '-') scale(1 / 1.6);
        else if (event.key === '0') animate().call(zoom.transform, d3.zoomIdentity);
        else {
          const directions = {ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100]};
          const delta = directions[event.key];
          if (delta) animate().call(zoom.translateBy, ...delta);
        }
      });
      buttons.forEach(button => { button.disabled = false; });
      loading.hidden = true;
    } catch (error) {
      document.querySelector('#ohio-precinct-map').hidden = true;
      loading.textContent = 'Ohio’s boundary map could not load. Refresh the page to try again.';
      console.error(error);
    }
  };
  document.body.append(load);
})();
