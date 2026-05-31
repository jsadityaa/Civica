(() => {
  const dropdowns = Array.from(document.querySelectorAll('.global-nav-dropdown'));
  if (!dropdowns.length) return;

  const closeDropdown = (dropdown) => {
    const trigger = dropdown.querySelector('.global-nav-link');
    dropdown.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  };

  const closeAllDropdowns = () => {
    dropdowns.forEach(closeDropdown);
  };

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.global-nav-link');
    const menu = dropdown.querySelector('.global-nav-dropdown-menu');
    if (!trigger || !menu) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const isOpen = dropdown.classList.contains('is-open');
      closeAllDropdowns();

      if (!isOpen) {
        dropdown.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    dropdown.addEventListener('mouseleave', () => {
      closeDropdown(dropdown);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.global-nav-dropdown')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllDropdowns();
    }
  });
})();
