(() => {
  const initialTimestamp = window.POLYCIVIC_MIDTERM_RESULTS_2026?.capturedAt;
  if (!initialTimestamp) return;
  let loading = false;
  let pendingReload = false;
  const editing = () => document.activeElement?.matches("input, select, textarea, [contenteditable='true']");
  const reloadWhenReady = () => {
    if (pendingReload && !editing()) window.location.reload();
  };
  document.addEventListener("focusout", () => {
    if (pendingReload) setTimeout(reloadWhenReady, 1000);
  });
  setInterval(() => {
    if (pendingReload) { reloadWhenReady(); return; }
    if (loading) return;
    loading = true;
    const script = document.createElement("script");
    script.src = `./midterms-2026-results-data.js?refresh=${Date.now()}`;
    script.onload = () => {
      loading = false;
      script.remove();
      const timestamp = window.POLYCIVIC_MIDTERM_RESULTS_2026?.capturedAt;
      if (timestamp && Date.parse(timestamp) > Date.parse(initialTimestamp)) {
        pendingReload = true;
        reloadWhenReady();
      }
    };
    script.onerror = () => { loading = false; script.remove(); };
    document.body.append(script);
  }, 5 * 60 * 1000);
})();
