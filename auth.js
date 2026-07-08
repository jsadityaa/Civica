(() => {
  const loginButtons = Array.from(document.querySelectorAll(".login-button"));
  const accountButtons = Array.from(document.querySelectorAll(".account-button"));
  const accountLabels = Array.from(document.querySelectorAll(".account-label"));
  const accountAvatars = Array.from(document.querySelectorAll(".account-avatar"));
  const signUpButtons = [];

  if (!loginButtons.length && !accountButtons.length) return;

  loginButtons.forEach((button) => {
    const siblingAccountButton = button.parentElement && button.parentElement.querySelector(".account-button");
    const signUpButton = document.createElement("button");
    signUpButton.type = "button";
    signUpButton.className = "signup-button";
    signUpButton.textContent = "Sign Up";

    if (button.parentElement) {
      button.parentElement.insertBefore(signUpButton, siblingAccountButton || button.nextSibling);
      signUpButtons.push(signUpButton);
    }
  });

  loginButtons.forEach((button) => {
    button.hidden = false;
  });

  signUpButtons.forEach((button) => {
    button.hidden = false;
  });

  accountButtons.forEach((button) => {
    button.hidden = true;
    button.dataset.signedIn = "false";
  });

  const authConfig = window.POLYCIVIC_AUTH_CONFIG || {};
  const firebaseConfig = authConfig.firebase || {};
  const requiredFirebaseKeys = ["apiKey", "authDomain", "projectId", "appId"];
  const isFirebaseConfigured = requiredFirebaseKeys.every((key) => {
    return typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim();
  });

  let auth = null;
  let currentUser = null;
  let isSignUpMode = false;

  const getInitial = (value) => {
    return (value || "?").trim().charAt(0).toUpperCase() || "?";
  };

  const sanitizeUser = (user) => {
    if (!user) return null;
    const displayName = user.displayName || user.email || "Account";
    return {
      uid: user.uid,
      email: user.email || "",
      displayName,
      photoURL: user.photoURL || "",
      initial: getInitial(displayName)
    };
  };

  const setHeaderState = (user) => {
    const isSignedIn = !!user;
    const label = isSignedIn ? user.displayName : "Account";
    const avatarText = isSignedIn ? user.initial : "A";

    loginButtons.forEach((button) => {
      button.hidden = isSignedIn;
      button.textContent = "Log In";
    });

    signUpButtons.forEach((button) => {
      button.hidden = isSignedIn;
    });

    accountButtons.forEach((button) => {
      button.hidden = !isSignedIn;
      button.dataset.signedIn = isSignedIn ? "true" : "false";
      button.setAttribute("aria-label", isSignedIn ? `${label} account menu` : "Account");
    });

    accountLabels.forEach((node) => {
      node.textContent = label;
    });

    accountAvatars.forEach((node) => {
      if (user && user.photoURL) {
        node.style.backgroundImage = `url("${user.photoURL}")`;
        node.style.backgroundSize = "cover";
        node.style.backgroundPosition = "center";
        node.textContent = "";
      } else {
        node.style.backgroundImage = "";
        node.textContent = avatarText;
      }
    });
  };

  const broadcastAuthState = () => {
    const user = sanitizeUser(currentUser);
    window.POLYCIVIC_AUTH = {
      getCurrentUser: () => user
    };
    window.dispatchEvent(new CustomEvent("polycivic-auth-changed", {
      detail: { user }
    }));
  };

  const overlay = document.createElement("div");
  overlay.className = "polycivic-auth-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="polycivic-auth-modal" role="dialog" aria-modal="true" aria-labelledby="polycivic-auth-title">
      <button type="button" class="polycivic-auth-close" aria-label="Close sign in dialog">&times;</button>
      <div class="polycivic-auth-copy">
        <p class="polycivic-auth-eyebrow">Account access</p>
        <h2 id="polycivic-auth-title">Sign in to Polycivic</h2>
        <p class="polycivic-auth-description">Use Google or an email address to save your identity across the site once Firebase is configured.</p>
      </div>

      <div class="polycivic-auth-setup" hidden>
        <p>Authentication is scaffolded, but it still needs your Firebase project keys in <code>auth-config.js</code>.</p>
        <p>Add your Firebase config there, enable Google and Email/Password in Firebase Authentication, then reload the site.</p>
      </div>

      <div class="polycivic-auth-live">
        <button type="button" class="polycivic-auth-google">Continue with Google</button>

        <div class="polycivic-auth-divider"><span>or</span></div>

        <form class="polycivic-auth-form" novalidate>
          <label class="polycivic-auth-field polycivic-auth-name-field">
            <span>Name</span>
            <input type="text" id="polycivic-auth-name" autocomplete="name" placeholder="Your name" />
          </label>
          <label class="polycivic-auth-field">
            <span>Email</span>
            <input type="email" id="polycivic-auth-email" autocomplete="email" placeholder="you@example.com" required />
          </label>
          <label class="polycivic-auth-field">
            <span>Password</span>
            <input type="password" id="polycivic-auth-password" autocomplete="current-password" placeholder="Password" required />
          </label>
          <p class="polycivic-auth-error" aria-live="polite"></p>
          <button type="submit" class="polycivic-auth-submit">Sign in</button>
        </form>

        <button type="button" class="polycivic-auth-switch">Need an account? Create one</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const accountMenu = document.createElement("div");
  accountMenu.className = "polycivic-account-menu";
  accountMenu.hidden = true;
  accountMenu.innerHTML = `
    <div class="polycivic-account-menu__summary">
      <strong class="polycivic-account-menu__name">Account</strong>
      <span class="polycivic-account-menu__email">Signed out</span>
    </div>
    <button type="button" class="polycivic-account-menu__action" data-auth-action="signin">Sign in</button>
    <button type="button" class="polycivic-account-menu__action" data-auth-action="signout">Sign out</button>
  `;
  document.body.appendChild(accountMenu);

  const authModal = {
    close: overlay.querySelector(".polycivic-auth-close"),
    setup: overlay.querySelector(".polycivic-auth-setup"),
    live: overlay.querySelector(".polycivic-auth-live"),
    google: overlay.querySelector(".polycivic-auth-google"),
    form: overlay.querySelector(".polycivic-auth-form"),
    nameField: overlay.querySelector(".polycivic-auth-name-field"),
    nameInput: overlay.querySelector("#polycivic-auth-name"),
    emailInput: overlay.querySelector("#polycivic-auth-email"),
    passwordInput: overlay.querySelector("#polycivic-auth-password"),
    submit: overlay.querySelector(".polycivic-auth-submit"),
    error: overlay.querySelector(".polycivic-auth-error"),
    switchMode: overlay.querySelector(".polycivic-auth-switch")
  };

  const accountMenuEls = {
    name: accountMenu.querySelector(".polycivic-account-menu__name"),
    email: accountMenu.querySelector(".polycivic-account-menu__email"),
    signIn: accountMenu.querySelector('[data-auth-action="signin"]'),
    signOut: accountMenu.querySelector('[data-auth-action="signout"]')
  };

  const clearModalError = () => {
    authModal.error.textContent = "";
  };

  const setModalMode = (signUpMode) => {
    isSignUpMode = signUpMode;
    authModal.nameField.hidden = !signUpMode;
    authModal.submit.textContent = signUpMode ? "Create account" : "Sign in";
    authModal.switchMode.textContent = signUpMode
      ? "Already have an account? Sign in"
      : "Need an account? Create one";
    authModal.passwordInput.setAttribute("autocomplete", signUpMode ? "new-password" : "current-password");
    clearModalError();
  };

  const openModal = () => {
    closeAccountMenu();
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("polycivic-auth-open");
    if (isFirebaseConfigured && window.firebase) {
      authModal.setup.hidden = true;
      authModal.live.hidden = false;
      authModal.emailInput.focus();
    } else {
      authModal.setup.hidden = false;
      authModal.live.hidden = true;
    }
  };

  const closeModal = () => {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("polycivic-auth-open");
    clearModalError();
  };

  const toggleAccountMenu = (anchor) => {
    if (accountMenu.hidden) {
      const rect = anchor.getBoundingClientRect();
      accountMenu.style.top = `${rect.bottom + window.scrollY + 10}px`;
      accountMenu.style.left = `${rect.right + window.scrollX - 240}px`;
      accountMenu.hidden = false;
    } else {
      accountMenu.hidden = true;
    }
  };

  const closeAccountMenu = () => {
    accountMenu.hidden = true;
  };

  const updateAccountMenu = (user) => {
    if (user) {
      accountMenuEls.name.textContent = user.displayName;
      accountMenuEls.email.textContent = user.email || "Signed in";
      accountMenuEls.signIn.hidden = true;
      accountMenuEls.signOut.hidden = false;
    } else {
      accountMenuEls.name.textContent = "Account";
      accountMenuEls.email.textContent = "Signed out";
      accountMenuEls.signIn.hidden = false;
      accountMenuEls.signOut.hidden = true;
    }
  };

  const getFriendlyError = (error) => {
    const code = error && error.code ? error.code : "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "That email or password did not match an account.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was closed before it finished.";
      case "auth/account-exists-with-different-credential":
        return "That email already uses a different sign-in method.";
      case "auth/email-already-in-use":
        return "An account already exists for that email.";
      case "auth/weak-password":
        return "Choose a stronger password with at least six characters.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/network-request-failed":
        return "The sign-in request failed because the network is unavailable.";
      default:
        return error && error.message ? error.message : "Something went wrong while signing in.";
    }
  };

  const hydrateFirebase = () => {
    if (!isFirebaseConfigured || !window.firebase) {
      setHeaderState(null);
      updateAccountMenu(null);
      broadcastAuthState();
      return;
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    auth = window.firebase.auth();
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      const safeUser = sanitizeUser(user);
      setHeaderState(safeUser);
      updateAccountMenu(safeUser);
      broadcastAuthState();
    });
  };

  const signInWithGoogle = async () => {
    if (!auth || !window.firebase) return;
    clearModalError();
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await auth.signInWithPopup(provider);
      closeModal();
    } catch (error) {
      authModal.error.textContent = getFriendlyError(error);
    }
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    if (!auth) return;

    clearModalError();
    const email = authModal.emailInput.value.trim();
    const password = authModal.passwordInput.value;
    const name = authModal.nameInput.value.trim();

    if (!email || !password) {
      authModal.error.textContent = "Enter both an email and password.";
      return;
    }

    if (isSignUpMode && !name) {
      authModal.error.textContent = "Add your name so it shows up on posts and replies.";
      return;
    }

    try {
      if (isSignUpMode) {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        if (credential.user && name) {
          await credential.user.updateProfile({ displayName: name });
        }
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }

      authModal.form.reset();
      setModalMode(false);
      closeModal();
    } catch (error) {
      authModal.error.textContent = getFriendlyError(error);
    }
  };

  loginButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setModalMode(false);
      openModal();
    });
  });

  signUpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setModalMode(true);
      openModal();
    });
  });

  accountButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!currentUser) {
        setModalMode(false);
        openModal();
        return;
      }
      toggleAccountMenu(button);
    });
  });

  accountMenuEls.signIn.addEventListener("click", () => {
    closeAccountMenu();
    openModal();
  });

  accountMenuEls.signOut.addEventListener("click", async () => {
    closeAccountMenu();
    if (!auth) return;
    await auth.signOut();
  });

  authModal.close.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeModal();
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".polycivic-auth-close")) {
      closeModal();
    }
  });
  authModal.google.addEventListener("click", signInWithGoogle);
  authModal.form.addEventListener("submit", handleEmailAuth);
  authModal.switchMode.addEventListener("click", () => {
    setModalMode(!isSignUpMode);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".account-button") && !event.target.closest(".polycivic-account-menu")) {
      closeAccountMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeAccountMenu();
    }
  });

  setModalMode(false);
  hydrateFirebase();
})();
