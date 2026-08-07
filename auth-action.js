(() => {
  const eyebrow = document.querySelector("[data-action-eyebrow]");
  const title = document.querySelector("[data-action-title]");
  const copy = document.querySelector("[data-action-copy]");
  const form = document.querySelector("[data-reset-form]");
  const status = document.querySelector("[data-action-status]");
  const passwordInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-password");

  if (!eyebrow || !title || !copy || !form || !status || !passwordInput || !confirmInput) return;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const continueUrl = params.get("continueUrl") || "/settings";
  const authConfig = window.POLYCIVIC_AUTH_CONFIG || {};
  const firebaseConfig = authConfig.firebase || {};
  const getSettingsUrl = (verified = false) => {
    const url = new URL(continueUrl || "/settings", window.location.origin);
    if (verified) {
      url.searchParams.set("verified", "email");
    }
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const setStatus = (message, type = "") => {
    status.textContent = message;
    status.dataset.status = type;
  };

  const getFriendlyActionError = (error) => {
    const code = error && error.code ? error.code : "";
    switch (code) {
      case "auth/expired-action-code":
        return "This secure link has expired. Request a new email and try again.";
      case "auth/invalid-action-code":
        return "This secure link is invalid or has already been used.";
      case "auth/weak-password":
        return "Use a stronger password with at least six characters.";
      case "auth/network-request-failed":
        return "The request failed because the network is unavailable.";
      default:
        return "This secure link could not be used.";
    }
  };

  const initFirebase = () => {
    if (!window.firebase || !firebaseConfig.apiKey) {
      throw new Error("Firebase is not configured.");
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    return window.firebase.auth();
  };

  const requireCode = () => {
    if (!oobCode) {
      throw new Error("This secure link is missing its code.");
    }
  };

  const handleResetPassword = async (auth) => {
    eyebrow.textContent = "Account Security";
    title.textContent = "Reset your password";
    requireCode();

    const email = await auth.verifyPasswordResetCode(oobCode);
    copy.textContent = `Choose a new password for ${email}.`;
    form.hidden = false;
    setStatus("");
  };

  const handleVerifyEmail = async (auth) => {
    eyebrow.textContent = "Email Verification";
    title.textContent = "Verify your email";
    requireCode();

    await auth.applyActionCode(oobCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
    }
    window.location.replace(getSettingsUrl(true));
  };

  const handleRecoverEmail = async (auth) => {
    eyebrow.textContent = "Account Recovery";
    title.textContent = "Recover your email";
    requireCode();

    await auth.checkActionCode(oobCode);
    await auth.applyActionCode(oobCode);
    copy.textContent = "Your account email has been recovered.";
    setStatus("Success. Review your account settings to confirm everything looks correct.", "success");
  };

  const init = async () => {
    try {
      const auth = initFirebase();

      if (mode === "resetPassword") {
        await handleResetPassword(auth);
        return;
      }

      if (mode === "verifyEmail") {
        await handleVerifyEmail(auth);
        return;
      }

      if (mode === "recoverEmail") {
        await handleRecoverEmail(auth);
        return;
      }

      window.location.replace(getSettingsUrl());
    } catch (error) {
      form.hidden = true;
      title.textContent = "Account link failed";
      copy.textContent = error.message === "This secure link is missing its code."
        ? error.message
        : "This Polycivic account link cannot be used.";
      setStatus(getFriendlyActionError(error), "error");
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const password = passwordInput.value;
    const confirmation = confirmInput.value;

    if (password.length < 6) {
      setStatus("Use a password with at least six characters.", "error");
      return;
    }

    if (password !== confirmation) {
      setStatus("The passwords do not match.", "error");
      return;
    }

    try {
      const auth = initFirebase();
      await auth.confirmPasswordReset(oobCode, password);
      form.hidden = true;
      copy.textContent = "Your password has been updated.";
      setStatus("Success. You can now sign in with your new password.", "success");
    } catch (error) {
      setStatus(getFriendlyActionError(error), "error");
    }
  });

  init();
})();
