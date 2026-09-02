(() => {
  try {
    if (window.localStorage.getItem("datahub-dyslexic-ui") === "true") {
      document.documentElement.setAttribute("data-dyslexic", "true");
    }
  } catch (error) {}
})();

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
  const authActionSettings = {
    url: authConfig.actionUrl || "https://polycivic.com/",
    handleCodeInApp: false
  };
  const requiredFirebaseKeys = ["apiKey", "authDomain", "projectId", "appId"];
  const isFirebaseConfigured = requiredFirebaseKeys.every((key) => {
    return typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim();
  });

  let auth = null;
  let db = null;
  let functions = null;
  let currentUser = null;
  let currentProfile = null;
  let isSignUpMode = false;
  let firestoreLoadPromise = null;
  let storageLoadPromise = null;
  let functionsLoadPromise = null;
  let appCheckLoadPromise = null;
  let appCheckInitialized = false;
  let profileUnsubscribe = null;
  const firestoreCompatSrc = "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";
  const storageCompatSrc = "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js";
  const functionsCompatSrc = "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions-compat.js";
  const appCheckCompatSrc = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check-compat.js";

  const getInitial = (value) => {
    return (value || "?").trim().charAt(0).toUpperCase() || "?";
  };

  const getLocalProfileKey = (uid) => `polycivic-profile:${uid}`;

  const makeLocalProfile = (uid, profile = {}) => {
    return {
      uid,
      email: profile.email || "",
      displayName: profile.displayName || "",
      username: profile.username || "",
      usernameLower: profile.usernameLower || "",
      bio: Object.prototype.hasOwnProperty.call(profile, "bio") ? profile.bio || "" : "",
      photoURL: profile.photoURL || "",
      birthday: profile.birthday || "",
      birthdayAt: profile.birthdayAt?.toMillis
        ? profile.birthdayAt.toMillis()
        : profile.birthdayAt || null,
      emailVerified: !!profile.emailVerified,
      role: profile.role || "user",
      clientUpdatedAt: Number(profile.clientUpdatedAt) || 0,
      cachedAt: Date.now()
    };
  };

  const getLocalProfile = (uid) => {
    if (!uid) return null;
    try {
      const storedProfile = window.localStorage.getItem(getLocalProfileKey(uid));
      return storedProfile ? JSON.parse(storedProfile) : null;
    } catch (error) {
      return null;
    }
  };

  const saveLocalProfile = (uid, profile) => {
    if (!uid || !profile) return;
    try {
      window.localStorage.setItem(getLocalProfileKey(uid), JSON.stringify(makeLocalProfile(uid, profile)));
    } catch (error) {
      console.warn("Polycivic local profile save failed:", error);
    }
  };

  const getEditableProfileFields = (profile = {}) => {
    return {
      displayName: profile.displayName || "",
      username: profile.username || "",
      usernameLower: profile.usernameLower || "",
      bio: Object.prototype.hasOwnProperty.call(profile, "bio") ? profile.bio || "" : "",
      photoURL: profile.photoURL || ""
    };
  };

  const sanitizeUser = (user) => {
    if (!user) return null;
    const displayName = user.displayName || user.email || "Account";
    const localProfile = getLocalProfile(user.uid);
    return {
      uid: user.uid,
      email: user.email || "",
      displayName,
      photoURL: currentProfile?.photoURL || localProfile?.photoURL || user.photoURL || "",
      emailVerified: !!user.emailVerified,
      initial: getInitial(displayName)
    };
  };

  const loadScript = (src) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.loaded = "false";
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  };

  const getFirestoreDb = async () => {
    if (!isFirebaseConfigured || !window.firebase) return null;

    if (!window.firebase.firestore) {
      firestoreLoadPromise = firestoreLoadPromise || loadScript(firestoreCompatSrc);
      await firestoreLoadPromise;
    }

    db = db || window.firebase.firestore();
    return db;
  };

  const getFirebaseStorage = async () => {
    if (!isFirebaseConfigured || !window.firebase) return null;

    if (!window.firebase.storage) {
      storageLoadPromise = storageLoadPromise || loadScript(storageCompatSrc);
      await storageLoadPromise;
    }

    return window.firebase.storage();
  };

  const initializeAppCheck = async () => {
    if (!isFirebaseConfigured || !window.firebase || appCheckInitialized) return;

    const siteKey = (authConfig.appCheckSiteKey || "").trim();
    if (!siteKey) {
      return;
    }

    if (!window.firebase.appCheck) {
      appCheckLoadPromise = appCheckLoadPromise || loadScript(appCheckCompatSrc);
      await appCheckLoadPromise;
    }

    window.firebase.appCheck().activate(siteKey, true);
    appCheckInitialized = true;
  };

  const getFirebaseFunctions = async () => {
    if (!isFirebaseConfigured || !window.firebase) return null;

    await initializeAppCheck();

    if (!window.firebase.functions) {
      functionsLoadPromise = functionsLoadPromise || loadScript(functionsCompatSrc);
      await functionsLoadPromise;
    }

    functions = functions || window.firebase.app().functions("us-central1");
    return functions;
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
      getCurrentUser: () => user,
      getCurrentProfile: () => currentProfile || (currentUser ? getLocalProfile(currentUser.uid) : null),
      openLogin: () => {
        setModalMode(false);
        openModal();
      },
      openSignUp: () => {
        setModalMode(true);
        openModal();
      },
      updateDisplayName,
      updateProfileDetails,
      uploadProfilePicture,
      sendPasswordReset,
      sendVerificationEmail,
      reloadCurrentUser
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
        <h2 id="polycivic-auth-title">Sign in to Polycivic</h2>
      </div>

      <div class="polycivic-auth-live">
        <button type="button" class="polycivic-auth-google">
          <img src="./assets/google-signin-logo.png" alt="" class="polycivic-auth-google-icon" />
          <span>Continue with Google</span>
        </button>

        <div class="polycivic-auth-divider"><span>or</span></div>

        <form class="polycivic-auth-form" novalidate>
          <label class="polycivic-auth-field polycivic-auth-name-field">
            <span>Name</span>
            <input type="text" id="polycivic-auth-name" autocomplete="name" placeholder="Your name" />
          </label>
          <label class="polycivic-auth-field polycivic-auth-birthday-field">
            <span>Birthday</span>
            <input type="date" id="polycivic-auth-birthday" autocomplete="bday" />
          </label>
          <label class="polycivic-auth-field">
            <span>Email</span>
            <input type="email" id="polycivic-auth-email" autocomplete="email" placeholder="you@example.com" required />
          </label>
          <label class="polycivic-auth-field">
            <span>Password</span>
            <input type="password" id="polycivic-auth-password" autocomplete="current-password" placeholder="Password" required />
          </label>
          <label class="polycivic-auth-consent polycivic-auth-consent--hidden" aria-hidden="true">
            <input type="checkbox" id="polycivic-auth-consent" />
            <span>By signing up, I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
          </label>
          <p class="polycivic-auth-error" aria-live="polite"></p>
          <button type="submit" class="polycivic-auth-submit">Sign in</button>
        </form>

        <button type="button" class="polycivic-auth-forgot">Forgot password?</button>
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
    <a class="polycivic-account-menu__action polycivic-account-menu__link" href="/settings">Account settings</a>
    <button type="button" class="polycivic-account-menu__action" data-auth-action="signin">Sign in</button>
    <button type="button" class="polycivic-account-menu__action" data-auth-action="signout">Sign out</button>
  `;
  document.body.appendChild(accountMenu);

  const authModal = {
    close: overlay.querySelector(".polycivic-auth-close"),
    title: overlay.querySelector("#polycivic-auth-title"),
    live: overlay.querySelector(".polycivic-auth-live"),
    google: overlay.querySelector(".polycivic-auth-google"),
    form: overlay.querySelector(".polycivic-auth-form"),
    nameField: overlay.querySelector(".polycivic-auth-name-field"),
    nameInput: overlay.querySelector("#polycivic-auth-name"),
    birthdayField: overlay.querySelector(".polycivic-auth-birthday-field"),
    birthdayInput: overlay.querySelector("#polycivic-auth-birthday"),
    emailInput: overlay.querySelector("#polycivic-auth-email"),
    passwordInput: overlay.querySelector("#polycivic-auth-password"),
    consentField: overlay.querySelector(".polycivic-auth-consent"),
    consentInput: overlay.querySelector("#polycivic-auth-consent"),
    submit: overlay.querySelector(".polycivic-auth-submit"),
    error: overlay.querySelector(".polycivic-auth-error"),
    forgot: overlay.querySelector(".polycivic-auth-forgot"),
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

  const syncSubmitState = () => {
    authModal.submit.disabled = isSignUpMode && (!authModal.consentInput.checked || !authModal.birthdayInput.value);
  };

  const isAtLeastThirteen = (birthdayValue) => {
    if (!birthdayValue) return false;

    const birthday = new Date(`${birthdayValue}T00:00:00`);
    if (Number.isNaN(birthday.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    const dayDiff = today.getDate() - birthday.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age >= 13;
  };

  const getBirthdayTimestamp = (birthdayValue) => {
    if (!birthdayValue || !window.firebase?.firestore?.Timestamp) return null;

    const birthday = new Date(`${birthdayValue}T00:00:00`);
    if (Number.isNaN(birthday.getTime())) return null;

    return window.firebase.firestore.Timestamp.fromDate(birthday);
  };

  const validateSignUpEligibility = () => {
    if (!isSignUpMode) return true;

    if (!authModal.birthdayInput.value) {
      authModal.error.textContent = "Enter your birthday before creating an account.";
      return false;
    }

    if (!isAtLeastThirteen(authModal.birthdayInput.value)) {
      authModal.error.textContent = "You must be at least 13 years old to create a Polycivic account.";
      return false;
    }

    if (!authModal.consentInput.checked) {
      authModal.error.textContent = "Please agree to the Terms of Service and Privacy Policy before creating an account.";
      return false;
    }

    return true;
  };

  const setModalMode = (signUpMode) => {
    isSignUpMode = signUpMode;
    authModal.nameField.hidden = !signUpMode;
    authModal.birthdayField.hidden = !signUpMode;
    authModal.birthdayInput.required = signUpMode;
    authModal.birthdayInput.value = signUpMode ? authModal.birthdayInput.value : "";
    authModal.consentField.classList.toggle("polycivic-auth-consent--hidden", !signUpMode);
    authModal.consentField.setAttribute("aria-hidden", signUpMode ? "false" : "true");
    authModal.consentInput.checked = signUpMode ? authModal.consentInput.checked : false;
    authModal.title.textContent = signUpMode ? "Create your Polycivic account" : "Sign in to Polycivic";
    authModal.submit.textContent = signUpMode ? "Create account" : "Sign in";
    authModal.forgot.hidden = signUpMode;
    authModal.switchMode.textContent = signUpMode
      ? "Already have an account? Sign in"
      : "Need an account? Create one";
    authModal.passwordInput.setAttribute("autocomplete", signUpMode ? "new-password" : "current-password");
    syncSubmitState();
    clearModalError();
  };

  const openModal = () => {
    closeAccountMenu();
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("polycivic-auth-open");
    authModal.live.hidden = false;
    authModal.emailInput.focus();
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

  const buildProfilePayload = (user, extras = {}, existingProfile = null) => {
    const safeUser = sanitizeUser(user);
    const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
    const birthday = extras.birthday || existingProfile?.birthday || "";
    const birthdayAt = existingProfile?.birthdayAt || getBirthdayTimestamp(birthday);
    const localProfile = getLocalProfile(user.uid);
    const cachedProfile = currentProfile && currentProfile.uid === user.uid ? currentProfile : null;
    const latestProfile = [existingProfile, cachedProfile, localProfile]
      .filter(Boolean)
      .reduce((latest, profile) => {
        return (Number(profile.clientUpdatedAt) || 0) > (Number(latest?.clientUpdatedAt) || 0)
          ? profile
          : latest;
      }, existingProfile || cachedProfile || localProfile || {});

    return {
      displayName: extras.displayName || latestProfile?.displayName || safeUser.displayName,
      email: safeUser.email,
      username: Object.prototype.hasOwnProperty.call(extras, "username")
        ? extras.username
        : latestProfile?.username || "",
      usernameLower: Object.prototype.hasOwnProperty.call(extras, "usernameLower")
        ? extras.usernameLower
        : latestProfile?.usernameLower || "",
      bio: Object.prototype.hasOwnProperty.call(extras, "bio")
        ? extras.bio
        : latestProfile?.bio || "",
      photoURL: Object.prototype.hasOwnProperty.call(extras, "photoURL")
        ? extras.photoURL
        : latestProfile?.photoURL || user.photoURL || "",
      birthday,
      ...(birthdayAt ? { birthdayAt } : {}),
      role: existingProfile?.role || "user",
      clientUpdatedAt: Object.prototype.hasOwnProperty.call(extras, "clientUpdatedAt")
        ? extras.clientUpdatedAt
        : Number(latestProfile?.clientUpdatedAt)
          || Date.now(),
      updatedAt: timestamp,
      lastSignInAt: timestamp
    };
  };

  const applyRemoteProfile = (user, profile) => {
    if (!user || !profile) return;
    const localProfile = getLocalProfile(user.uid);
    const remoteClientUpdatedAt = Number(profile.clientUpdatedAt) || 0;
    const localClientUpdatedAt = Number(localProfile?.clientUpdatedAt) || 0;
    const shouldPreferLocal = localProfile && localClientUpdatedAt > remoteClientUpdatedAt;
    const mergedProfile = shouldPreferLocal
      ? {
          ...profile,
          ...getEditableProfileFields(localProfile),
          clientUpdatedAt: localClientUpdatedAt
        }
      : profile;

    currentProfile = {
      ...mergedProfile,
      uid: user.uid
    };
    saveLocalProfile(user.uid, currentProfile);

    if (shouldPreferLocal) {
      syncUserProfile(user, {
        ...getEditableProfileFields(localProfile),
        clientUpdatedAt: localClientUpdatedAt
      }).catch((error) => {
        console.warn("Polycivic profile resync failed:", error);
      });
    }

    const safeUser = sanitizeUser(user);
    setHeaderState(safeUser);
    updateAccountMenu(safeUser);
    broadcastAuthState();
  };

  const stopProfileListener = () => {
    if (typeof profileUnsubscribe === "function") {
      profileUnsubscribe();
    }
    profileUnsubscribe = null;
  };

  const watchUserProfile = async (user) => {
    stopProfileListener();
    if (!user) return;

    try {
      const database = await getFirestoreDb();
      if (!database) return;

      profileUnsubscribe = database.collection("users").doc(user.uid).onSnapshot((snapshot) => {
        if (!snapshot.exists) return;
        applyRemoteProfile(user, snapshot.data() || {});
      }, (error) => {
        console.warn("Polycivic profile listener failed:", error);
      });
    } catch (error) {
      console.warn("Polycivic profile listener setup failed:", error);
    }
  };

  const syncUserProfile = async (user, extras = {}, options = {}) => {
    if (!user) {
      currentProfile = null;
      broadcastAuthState();
      return null;
    }

    try {
      const database = await getFirestoreDb();
      if (!database) return null;

      const profileRef = database.collection("users").doc(user.uid);
      const snapshot = await profileRef.get();

      if (snapshot.exists) {
        const existingProfile = snapshot.data() || {};
        const payload = buildProfilePayload(user, extras, existingProfile);
        delete payload.role;
        delete payload.birthday;
        delete payload.birthdayAt;
        delete payload.emailVerified;

        if (extras.birthday) {
          const birthdayAt = getBirthdayTimestamp(extras.birthday);
          payload.birthday = extras.birthday;
          if (birthdayAt) {
            payload.birthdayAt = birthdayAt;
          }
        }

        await profileRef.update(payload);
        currentProfile = { ...existingProfile, ...payload, uid: user.uid };
      } else {
        const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
        const payload = {
          ...buildProfilePayload(user, extras),
          createdAt: timestamp
        };

        await profileRef.set(payload);
        currentProfile = { ...payload, uid: user.uid };
      }

      saveLocalProfile(user.uid, currentProfile);
      broadcastAuthState();
      return currentProfile;
    } catch (error) {
      console.warn("Polycivic profile sync failed:", error);
      if (options.throwOnError) {
        throw error;
      }
      return null;
    }
  };

  const updateDisplayName = async (displayName) => {
    if (!auth || !currentUser) {
      throw new Error("You must be signed in to update your profile.");
    }

    const cleanName = (displayName || "").trim();
    if (!cleanName) {
      throw new Error("Enter a display name.");
    }

    await currentUser.updateProfile({ displayName: cleanName });
    const safeUser = sanitizeUser(currentUser);
    setHeaderState(safeUser);
    updateAccountMenu(safeUser);
    broadcastAuthState();

    Promise.race([
      syncUserProfile(currentUser, { displayName: cleanName, clientUpdatedAt: Date.now() }),
      new Promise((resolve) => window.setTimeout(resolve, 2500))
    ]).catch((error) => {
      console.warn("Polycivic display name profile sync timed out:", error);
    });
  };

  const normalizeUsername = (username) => {
    return (username || "").trim().replace(/^@+/, "");
  };

  const updateProfileDetails = async ({ displayName, username, bio } = {}) => {
    if (!auth || !currentUser) {
      throw new Error("You must be signed in to update your profile.");
    }

    const cleanName = (displayName || "").trim();
    const cleanUsername = normalizeUsername(username);
    const usernameLower = cleanUsername.toLowerCase();
    const cleanBio = (bio || "").trim();

    if (!cleanName) {
      throw new Error("Enter a display name.");
    }

    if (!cleanUsername) {
      throw new Error("Enter a username.");
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
      throw new Error("Use 3-30 letters, numbers, periods, underscores, or hyphens for your username.");
    }

    if (cleanBio.length > 180) {
      throw new Error("Keep your bio under 180 characters.");
    }

    const database = await getFirestoreDb();
    if (!database) {
      throw new Error("Profile storage is unavailable. Try again in a moment.");
    }

    await currentUser.updateProfile({ displayName: cleanName });

    const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
    const clientUpdatedAt = Date.now();
    const profileRef = database.collection("users").doc(currentUser.uid);
    const usernameRef = database.collection("usernames").doc(usernameLower);

    await database.runTransaction(async (transaction) => {
      const profileSnapshot = await transaction.get(profileRef);
      const existingProfile = profileSnapshot.exists ? profileSnapshot.data() || {} : null;
      const previousUsernameLower = existingProfile?.usernameLower || getLocalProfile(currentUser.uid)?.usernameLower || "";

      if (previousUsernameLower !== usernameLower) {
        const usernameSnapshot = await transaction.get(usernameRef);
        if (usernameSnapshot.exists && usernameSnapshot.data()?.uid !== currentUser.uid) {
          throw new Error("That username is already taken.");
        }

        if (previousUsernameLower) {
          const previousUsernameRef = database.collection("usernames").doc(previousUsernameLower);
          const previousUsernameSnapshot = await transaction.get(previousUsernameRef);
          if (previousUsernameSnapshot.exists && previousUsernameSnapshot.data()?.uid === currentUser.uid) {
            transaction.delete(previousUsernameRef);
          }
        }
      }

      transaction.set(usernameRef, {
        uid: currentUser.uid,
        username: cleanUsername,
        updatedAt: timestamp
      }, { merge: true });

      const payload = buildProfilePayload(currentUser, {
        displayName: cleanName,
        username: cleanUsername,
        usernameLower,
        bio: cleanBio,
        clientUpdatedAt
      }, existingProfile);

      if (profileSnapshot.exists) {
        delete payload.role;
        delete payload.birthday;
        delete payload.emailVerified;
        transaction.update(profileRef, payload);
        currentProfile = { ...existingProfile, ...payload, uid: currentUser.uid };
      } else {
        transaction.set(profileRef, {
          ...payload,
          createdAt: timestamp
        });
        currentProfile = { ...payload, uid: currentUser.uid };
      }
    });

    saveLocalProfile(currentUser.uid, currentProfile);
    const safeUser = sanitizeUser(currentUser);
    setHeaderState(safeUser);
    updateAccountMenu(safeUser);
    broadcastAuthState();
    return currentProfile;
  };

  const readImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", () => reject(new Error("Your profile picture could not be read.")));
      reader.readAsDataURL(file);
    });
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", () => reject(new Error("Your profile picture could not be prepared.")));
      image.src = src;
    });
  };

  const canvasToBlob = (canvas, quality) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Your browser could not process this profile picture."));
      }, "image/jpeg", quality);
    });
  };

  const blobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", () => reject(new Error("Your profile picture could not be prepared.")));
      reader.readAsDataURL(blob);
    });
  };

  const compressProfilePicture = async (file) => {
    const sourceUrl = await readImageFile(file);
    const image = await loadImage(sourceUrl);
    const size = 256;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Your browser could not process this profile picture.");
    }

    canvas.width = size;
    canvas.height = size;
    const sourceSize = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const sourceX = ((image.naturalWidth || image.width) - sourceSize) / 2;
    const sourceY = ((image.naturalHeight || image.height) - sourceSize) / 2;

    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    let blob = await canvasToBlob(canvas, 0.84);
    const targetBytes = 180 * 1024;
    const qualities = [0.74, 0.64, 0.54, 0.44];

    for (const quality of qualities) {
      if (blob.size <= targetBytes) break;
      blob = await canvasToBlob(canvas, quality);
    }

    return {
      blob,
      dataUrl: await blobToDataUrl(blob)
    };
  };

  const updateProfilePicture = async (photoURL) => {
    if (!auth || !currentUser) {
      throw new Error("You must be signed in to update your profile picture.");
    }

    const cleanUrl = (photoURL || "").trim();
    if (!cleanUrl) {
      throw new Error("Choose an image first.");
    }

    currentProfile = {
      ...(currentProfile || getLocalProfile(currentUser.uid) || {}),
      uid: currentUser.uid,
      email: currentUser.email || "",
      displayName: currentUser.displayName || currentUser.email || "Account",
      photoURL: cleanUrl,
      clientUpdatedAt: Date.now()
    };
    saveLocalProfile(currentUser.uid, currentProfile);

    setHeaderState(sanitizeUser(currentUser));
    updateAccountMenu(sanitizeUser(currentUser));
    broadcastAuthState();

    await syncUserProfile(currentUser, {
      photoURL: cleanUrl,
      clientUpdatedAt: currentProfile.clientUpdatedAt
    }, { throwOnError: true });
    return cleanUrl;
  };

  const uploadProfilePicture = async (file) => {
    if (!auth || !currentUser) {
      throw new Error("You must be signed in to upload a profile picture.");
    }

    if (!file) {
      throw new Error("Choose an image first.");
    }

    if (!file.type || !file.type.startsWith("image/")) {
      throw new Error("Choose a valid image file.");
    }

    const maxFileSize = 35 * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new Error("Choose an image under 35 MB.");
    }

    const compressedImage = await compressProfilePicture(file);
    let photoURL = compressedImage.dataUrl;

    try {
      const storage = await getFirebaseStorage();
      if (storage) {
        const photoRef = storage.ref().child(`profile-pictures/${currentUser.uid}/avatar.jpg`);
        await photoRef.put(compressedImage.blob, {
          contentType: "image/jpeg",
          customMetadata: {
            owner: currentUser.uid
          }
        });
        photoURL = await photoRef.getDownloadURL();
      }
    } catch (error) {
      console.warn("Polycivic profile picture storage upload failed; using Firestore fallback:", error);
    }

    await updateProfilePicture(photoURL);
    return photoURL;
  };

  const sendPasswordReset = async (emailOverride = "") => {
    if (!auth) {
      throw new Error("Firebase Authentication is not ready.");
    }

    const email = (emailOverride || currentUser?.email || authModal.emailInput.value || "").trim();
    if (!email) {
      throw new Error("Enter your email address first.");
    }

    const functionsInstance = await getFirebaseFunctions();
    if (!functionsInstance) {
      throw new Error("Password reset is unavailable. Try again in a moment.");
    }

    const requestPasswordReset = functionsInstance.httpsCallable("requestPasswordReset");
    await requestPasswordReset({ email });
  };

  const sendVerificationEmail = async () => {
    if (!currentUser) {
      throw new Error("You must be signed in to verify your email.");
    }

    await currentUser.sendEmailVerification(authActionSettings);
  };

  const reloadCurrentUser = async () => {
    if (!currentUser) return null;
    await currentUser.reload();
    currentUser = auth.currentUser;
    await syncUserProfile(currentUser);
    return sanitizeUser(currentUser);
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
      if (user) {
        watchUserProfile(user);
        syncUserProfile(user);
      } else {
        stopProfileListener();
        currentProfile = null;
      }
    });
  };

  const removeRejectedSignupUser = async (user) => {
    if (!user) return;

    try {
      await user.delete();
    } catch (error) {
      console.warn("Polycivic rejected signup cleanup failed:", error);
    }
  };

  const showServerAgeRejection = () => {
    authModal.error.textContent = "Your account could not be created. Make sure you are at least 13 years old.";
  };

  const signInWithGoogle = async () => {
    if (!auth || !window.firebase) return;
    clearModalError();
    if (!validateSignUpEligibility()) {
      return;
    }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const credential = await auth.signInWithPopup(provider);
      const isNewGoogleUser = credential.additionalUserInfo && credential.additionalUserInfo.isNewUser;
      if (isNewGoogleUser && !isSignUpMode) {
        await credential.user.delete();
        authModal.error.textContent = "Use Sign Up to create a new account.";
        return;
      }
      if (isSignUpMode && credential.user) {
        try {
          await syncUserProfile(
            credential.user,
            { birthday: authModal.birthdayInput.value },
            { throwOnError: true }
          );
        } catch (profileError) {
          console.warn("Polycivic profile sync failed after Google signup:", profileError);
          await removeRejectedSignupUser(credential.user);
          showServerAgeRejection();
          return;
        }
      }
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
    const birthday = authModal.birthdayInput.value;

    if (!email || !password) {
      authModal.error.textContent = "Enter both an email and password.";
      return;
    }

    if (isSignUpMode && !name) {
      authModal.error.textContent = "Add your name so it shows up on posts and replies.";
      return;
    }

    if (!validateSignUpEligibility()) {
      return;
    }

    try {
      if (isSignUpMode) {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        if (credential.user && name) {
          await credential.user.updateProfile({ displayName: name });
        }
        if (credential.user && birthday) {
          try {
            await syncUserProfile(
              credential.user,
              { birthday, displayName: name },
              { throwOnError: true }
            );
          } catch (profileError) {
            console.warn("Polycivic profile sync failed after signup:", profileError);
            await removeRejectedSignupUser(credential.user);
            showServerAgeRejection();
            return;
          }
        }
        if (credential.user && !credential.user.emailVerified) {
          credential.user.sendEmailVerification(authActionSettings).catch((verificationError) => {
            console.warn("Polycivic verification email failed after signup:", verificationError);
          });
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
  authModal.consentInput.addEventListener("change", syncSubmitState);
  authModal.birthdayInput.addEventListener("input", syncSubmitState);
  authModal.forgot.addEventListener("click", async () => {
    clearModalError();
    try {
      await sendPasswordReset();
      authModal.error.textContent = "Password reset email sent.";
    } catch (error) {
      authModal.error.textContent = getFriendlyError(error);
    }
  });
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
