(() => {
  const viewport = document.getElementById('workspace-page');
  const view = document.getElementById('view');
  const menu = document.getElementById('tabs');
  const controls = document.querySelector('.workspace-pages');
  const [previous, next] = controls.querySelectorAll('button');
  const status = controls.querySelector('[role=status]');
  const desktop = matchMedia('(min-width: 900px) and (min-height: 600px)');
  let page = 1;

  function updatePages() {
    const active = desktop.matches && menu.querySelector('[role=tab]');
    const needed = active && (controls.hidden
      ? viewport.scrollHeight > viewport.clientHeight + 1
      : viewport.scrollHeight > viewport.clientHeight + controls.offsetHeight + 1);
    controls.hidden = !needed;
    if (!needed) return;
    const height = viewport.clientHeight;
    const end = viewport.scrollHeight - height;
    const pages = Math.ceil(viewport.scrollHeight / height);
    page = viewport.scrollTop >= end - 1 ? pages : Math.floor((viewport.scrollTop + 1) / height) + 1;
    previous.disabled = viewport.scrollTop <= 1;
    next.disabled = viewport.scrollTop >= end - 1;
    const label = `Página ${page} de ${pages}`;
    if (status.textContent !== label) status.textContent = label;
  }

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page-step]');
    if (button) viewport.scrollTo(0, (page - 1 + Number(button.dataset.pageStep)) * viewport.clientHeight);
  });
  viewport.addEventListener('scroll', updatePages, { passive: true });
  desktop.addEventListener('change', updatePages);
  const size = new ResizeObserver(updatePages);
  size.observe(viewport);
  size.observe(view);
  let section;
  new MutationObserver(() => {
    const current = menu.querySelector('[aria-selected=true]')?.dataset.k;
    if (current !== section) viewport.scrollTop = 0;
    section = current;
    updatePages();
  }).observe(menu, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
  updatePages();
})();
