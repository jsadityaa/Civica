(() => {
  const storageKey = "polycivic-forum-v2-empty";

  const seedThreads = [];

  const categoryLabels = {
    all: "All topics",
    elections: "Elections",
    forecasting: "Forecasting",
    policy: "Policy",
    "site-feedback": "Site feedback"
  };

  const els = {
    composerPanel: document.getElementById("forum-composer-panel"),
    mainGrid: document.getElementById("forum-main-grid"),
    threadList: document.getElementById("forum-thread-list"),
    threadForm: document.getElementById("forum-thread-form"),
    replyForm: document.getElementById("forum-reply-form"),
    authBanner: document.getElementById("forum-auth-banner"),
    composerLocked: document.getElementById("forum-composer-locked"),
    threadsLocked: document.getElementById("forum-threads-locked"),
    replyLocked: document.getElementById("forum-reply-locked"),
    signUpButton: document.getElementById("forum-sign-up-button"),
    logInButton: document.getElementById("forum-log-in-button"),
    authTriggers: Array.from(document.querySelectorAll("[data-auth-trigger]")),
    filters: Array.from(document.querySelectorAll(".forum-page__filter")),
    emptyState: document.getElementById("forum-empty-state"),
    detailWrap: document.getElementById("forum-thread-detail"),
    messageList: document.getElementById("forum-message-list"),
    detailCategory: document.getElementById("forum-detail-category"),
    detailMeta: document.getElementById("forum-detail-meta"),
    detailTitle: document.getElementById("forum-detail-title"),
    threadSearch: document.getElementById("forum-thread-search"),
    threadSort: document.getElementById("forum-thread-sort"),
    upvoteButton: document.getElementById("forum-upvote-button"),
    upvoteCount: document.getElementById("forum-upvote-count"),
    threadAuthor: document.getElementById("forum-thread-author"),
    threadCategory: document.getElementById("forum-thread-category"),
    threadTitle: document.getElementById("forum-thread-title"),
    threadBody: document.getElementById("forum-thread-body"),
    replyAuthor: document.getElementById("forum-reply-author"),
    replyBody: document.getElementById("forum-reply-body")
  };

  if (!els.threadList || !els.threadForm || !els.replyForm) return;

  const loadState = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.threads)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveState = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      activeFilter: state.activeFilter,
      activeThreadId: state.activeThreadId,
      searchQuery: state.searchQuery,
      sortMode: state.sortMode,
      guestName: state.guestName,
      threads: state.threads
    }));
  };

  const initial = loadState();
  const state = {
    activeFilter: initial?.activeFilter || "all",
    activeThreadId: initial?.activeThreadId || null,
    searchQuery: initial?.searchQuery || "",
    sortMode: initial?.sortMode || "active",
    guestName: initial?.guestName || "",
    authUser: window.POLYCIVIC_AUTH && typeof window.POLYCIVIC_AUTH.getCurrentUser === "function"
      ? window.POLYCIVIC_AUTH.getCurrentUser()
      : null,
    threads: (initial?.threads || seedThreads).slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  };

  const getPreferredAuthor = () => {
    if (state.authUser && state.authUser.displayName) return state.authUser.displayName;
    if (state.authUser && state.authUser.email) return state.authUser.email;
    return state.guestName;
  };

  const openAuthFlow = (mode) => {
    if (!window.POLYCIVIC_AUTH) return;
    if (mode === "signup" && typeof window.POLYCIVIC_AUTH.openSignUp === "function") {
      window.POLYCIVIC_AUTH.openSignUp();
      return;
    }
    if (typeof window.POLYCIVIC_AUTH.openLogin === "function") {
      window.POLYCIVIC_AUTH.openLogin();
    }
  };

  const formatRelativeTime = (iso) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = Math.max(0, now - then);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCategory = (value) => categoryLabels[value] || value;

  const getFilteredThreads = () => {
    let threads = state.threads.slice();

    if (state.activeFilter !== "all") {
      threads = threads.filter((thread) => thread.category === state.activeFilter);
    }

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      threads = threads.filter((thread) => {
        if (thread.title.toLowerCase().includes(query)) return true;
        return thread.posts.some((post) => post.body.toLowerCase().includes(query) || post.author.toLowerCase().includes(query));
      });
    }

    if (state.sortMode === "newest") {
      threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (state.sortMode === "popular") {
      threads.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0) || new Date(b.updatedAt) - new Date(a.updatedAt));
    } else {
      threads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    return threads;
  };

  const ensureActiveThread = () => {
    const filtered = getFilteredThreads();
    if (!filtered.length) {
      state.activeThreadId = null;
      return;
    }
    if (!filtered.some((thread) => thread.id === state.activeThreadId)) {
      state.activeThreadId = filtered[0].id;
    }
  };

  const renderThreadList = () => {
    if (!state.authUser) {
      els.threadList.innerHTML = "";
      els.emptyState.hidden = true;
      els.detailWrap.hidden = false;
      return;
    }

    ensureActiveThread();
    const filtered = getFilteredThreads();
    els.threadList.innerHTML = "";

    filtered.forEach((thread) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `forum-page__thread-card${thread.id === state.activeThreadId ? " is-active" : ""}`;
      button.dataset.threadId = thread.id;

      const lastPost = thread.posts[thread.posts.length - 1];
      button.innerHTML = `
        <div class="forum-page__thread-card-top">
          <span class="forum-page__thread-card-category">${formatCategory(thread.category)}</span>
          <span class="forum-page__thread-card-time">${formatRelativeTime(thread.updatedAt)}</span>
        </div>
        <h3>${thread.title}</h3>
          <p>${lastPost?.body || ""}</p>
        <div class="forum-page__thread-card-bottom">
          <span>${thread.posts.length} ${thread.posts.length === 1 ? "post" : "posts"}</span>
          <span>${thread.upvotes || 0} upvotes${lastPost ? ` · Latest by ${lastPost.author}` : ""}</span>
        </div>
      `;

      button.addEventListener("click", () => {
        state.activeThreadId = thread.id;
        saveState();
        render();
      });

      els.threadList.appendChild(button);
    });

    els.emptyState.hidden = filtered.length > 0;
    els.detailWrap.hidden = filtered.length === 0;
  };

  const renderDetail = () => {
    if (!state.authUser) {
      els.detailCategory.textContent = "Forum";
      els.detailMeta.textContent = "Sign in required";
      els.detailTitle.textContent = "Create an account to enter the conversation.";
      els.messageList.innerHTML = "";
      if (els.upvoteCount) {
        els.upvoteCount.textContent = "0";
      }
      return;
    }

    const thread = state.threads.find((item) => item.id === state.activeThreadId);
    if (!thread) {
      els.messageList.innerHTML = "";
      return;
    }

    const firstPost = thread.posts[0];
    els.detailCategory.textContent = formatCategory(thread.category);
    els.detailMeta.textContent = `Started by ${firstPost.author} · ${formatRelativeTime(thread.createdAt)}`;
    els.detailTitle.textContent = thread.title;
    if (els.upvoteCount) {
      els.upvoteCount.textContent = String(thread.upvotes || 0);
    }

    els.messageList.innerHTML = "";
    thread.posts.forEach((post, index) => {
      const article = document.createElement("article");
      article.className = `forum-page__message${index % 2 === 0 ? " forum-page__message--accent" : ""}`;
      article.innerHTML = `
        <div class="forum-page__message-avatar" aria-hidden="true">${post.author.slice(0, 1).toUpperCase()}</div>
        <div class="forum-page__message-body">
          <div class="forum-page__message-meta">
            <strong>${post.author}</strong>
            <span>${formatRelativeTime(post.createdAt)}</span>
          </div>
          <p>${post.body}</p>
        </div>
      `;
      els.messageList.appendChild(article);
    });
  };

  const renderFilters = () => {
    els.filters.forEach((button) => {
      const active = button.dataset.filter === state.activeFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (els.threadSearch) {
      els.threadSearch.value = state.searchQuery;
    }

    if (els.threadSort) {
      els.threadSort.value = state.sortMode;
    }
  };

  const render = () => {
    renderFilters();
    renderThreadList();
    renderDetail();
  };

  const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

  const syncGuestNames = () => {
    const preferredAuthor = getPreferredAuthor();
    const isSignedIn = !!state.authUser;

    if (els.threadAuthor) {
      els.threadAuthor.value = preferredAuthor;
      els.threadAuthor.readOnly = isSignedIn;
      els.threadAuthor.placeholder = isSignedIn ? "Signed in account" : "Your name";
    }

    if (els.replyAuthor) {
      els.replyAuthor.value = preferredAuthor;
      els.replyAuthor.readOnly = isSignedIn;
      els.replyAuthor.placeholder = isSignedIn ? "Signed in account" : "Your name";
    }
  };

  const syncAccessState = () => {
    const isSignedIn = !!state.authUser;

    if (els.authBanner) {
      els.authBanner.hidden = isSignedIn;
    }

    if (els.composerPanel) {
      els.composerPanel.hidden = !isSignedIn;
    }

    if (els.mainGrid) {
      els.mainGrid.hidden = !isSignedIn;
    }

    if (els.composerLocked) {
      els.composerLocked.hidden = isSignedIn;
    }

    if (els.threadsLocked) {
      els.threadsLocked.hidden = isSignedIn;
    }

    if (els.replyLocked) {
      els.replyLocked.hidden = isSignedIn;
    }

    if (els.threadForm) {
      els.threadForm.hidden = !isSignedIn;
    }

    if (els.replyForm) {
      els.replyForm.hidden = !isSignedIn;
    }

    if (els.threadList) {
      els.threadList.hidden = !isSignedIn;
    }

    if (els.upvoteButton) {
      els.upvoteButton.disabled = !isSignedIn;
      els.upvoteButton.setAttribute("aria-disabled", !isSignedIn ? "true" : "false");
    }
  };

  window.addEventListener("polycivic-auth-changed", (event) => {
    state.authUser = event.detail && event.detail.user ? event.detail.user : null;
    syncGuestNames();
    syncAccessState();
    render();
  });

  els.filters.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter || "all";
      saveState();
      render();
    });
  });

  if (els.threadSearch) {
    els.threadSearch.addEventListener("input", () => {
      state.searchQuery = els.threadSearch.value.trim();
      saveState();
      render();
    });
  }

  if (els.threadSort) {
    els.threadSort.addEventListener("change", () => {
      state.sortMode = els.threadSort.value;
      saveState();
      render();
    });
  }

  if (els.signUpButton) {
    els.signUpButton.addEventListener("click", () => openAuthFlow("signup"));
  }

  if (els.logInButton) {
    els.logInButton.addEventListener("click", () => openAuthFlow("login"));
  }

  els.authTriggers.forEach((button) => {
    button.addEventListener("click", () => {
      openAuthFlow(button.dataset.authTrigger || "login");
    });
  });

  if (els.upvoteButton) {
    els.upvoteButton.addEventListener("click", () => {
      if (!state.authUser) {
        openAuthFlow("signup");
        return;
      }
      const thread = state.threads.find((item) => item.id === state.activeThreadId);
      if (!thread) return;
      thread.upvotes = (thread.upvotes || 0) + 1;
      thread.updatedAt = new Date().toISOString();
      saveState();
      render();
    });
  }

  els.threadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!state.authUser) {
      openAuthFlow("signup");
      return;
    }

    const author = (state.authUser?.displayName || state.authUser?.email || els.threadAuthor.value).trim();
    const category = els.threadCategory.value;
    const title = els.threadTitle.value.trim();
    const body = els.threadBody.value.trim();

    if (!author || !category || !title || !body) return;

    if (!state.authUser) {
      state.guestName = author;
    }
    const now = new Date().toISOString();
    const thread = {
      id: makeId("thread"),
      category,
      title,
      createdAt: now,
      updatedAt: now,
      upvotes: 0,
      posts: [
        {
          id: makeId("post"),
          author,
          body,
          createdAt: now
        }
      ]
    };

    state.threads.unshift(thread);
    state.activeFilter = "all";
    state.activeThreadId = thread.id;
    els.threadForm.reset();
    syncGuestNames();
    saveState();
    render();
  });

  els.replyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!state.authUser) {
      openAuthFlow("signup");
      return;
    }

    const thread = state.threads.find((item) => item.id === state.activeThreadId);
    if (!thread) return;

    const author = (state.authUser?.displayName || state.authUser?.email || els.replyAuthor.value).trim();
    const body = els.replyBody.value.trim();
    if (!author || !body) return;

    if (!state.authUser) {
      state.guestName = author;
    }
    const now = new Date().toISOString();
    thread.posts.push({
      id: makeId("post"),
      author,
      body,
      createdAt: now
    });
    thread.updatedAt = now;

    state.threads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    els.replyForm.reset();
    syncGuestNames();
    saveState();
    render();
  });

  syncGuestNames();
  syncAccessState();
  render();
})();
