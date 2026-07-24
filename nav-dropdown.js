(() => {
  const mobileBreakpoint = window.matchMedia('(max-width: 768px)');
  const headerInner = document.querySelector('.global-header-inner');
  const globalNav = document.querySelector('.global-nav');
  const accountUi = document.querySelector('.account-ui');
  const dropdowns = Array.from(document.querySelectorAll('.global-nav-dropdown'));
  if (!headerInner || !globalNav) return;

  let mobileToggle = null;

  const closeDropdown = (dropdown) => {
    const trigger = dropdown.querySelector('.global-nav-link');
    dropdown.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  };

  const closeAllDropdowns = () => {
    dropdowns.forEach(closeDropdown);
  };

  const closeMobileMenu = () => {
    if (!mobileToggle) return;
    headerInner.classList.remove('is-mobile-open');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Open navigation menu');
  };

  const openMobileMenu = () => {
    if (!mobileToggle) return;
    headerInner.classList.add('is-mobile-open');
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileToggle.setAttribute('aria-label', 'Close navigation menu');
  };

  const ensureMobileToggle = () => {
    if (mobileToggle) return;

    mobileToggle = document.createElement('button');
    mobileToggle.type = 'button';
    mobileToggle.className = 'global-nav-toggle';
    mobileToggle.setAttribute('aria-label', 'Open navigation menu');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-controls', 'global-mobile-navigation');
    mobileToggle.innerHTML = `
      <span class="global-nav-toggle__bar"></span>
      <span class="global-nav-toggle__bar"></span>
      <span class="global-nav-toggle__bar"></span>
    `;

    globalNav.id = globalNav.id || 'global-mobile-navigation';
    const insertionTarget = accountUi || globalNav;
    headerInner.insertBefore(mobileToggle, insertionTarget);

    mobileToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = headerInner.classList.contains('is-mobile-open');
      closeAllDropdowns();
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  };

  ensureMobileToggle();

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

    if (
      mobileBreakpoint.matches &&
      headerInner.classList.contains('is-mobile-open') &&
      !event.target.closest('.global-header-inner')
    ) {
      closeMobileMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllDropdowns();
      closeMobileMenu();
    }
  });

  const syncMobileMenuState = () => {
    if (!mobileBreakpoint.matches) {
      closeMobileMenu();
      closeAllDropdowns();
    }
  };

  if (typeof mobileBreakpoint.addEventListener === 'function') {
    mobileBreakpoint.addEventListener('change', syncMobileMenuState);
  } else if (typeof mobileBreakpoint.addListener === 'function') {
    mobileBreakpoint.addListener(syncMobileMenuState);
  }
})();
