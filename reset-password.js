(() => {
  const copy = document.querySelector("[data-reset-copy]");
  const form = document.querySelector("[data-reset-form]");
  const status = document.querySelector("[data-reset-status]");
  const passwordInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-password");

  if (!copy || !form || !status || !passwordInput || !confirmInput) return;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const authConfig = window.POLYCIVIC_AUTH_CONFIG || {};
  const firebaseConfig = authConfig.firebase || {};

  const setStatus = (message, type = "") => {
    status.textContent = message;
    status.dataset.status = type;
  };

  const getFriendlyResetError = (error) => {
    const code = error && error.code ? error.code : "";
    switch (code) {
      case "auth/expired-action-code":
        return "This reset link has expired. Request a new password reset email.";
      case "auth/invalid-action-code":
        return "This reset link is invalid or has already been used.";
      case "auth/weak-password":
        return "Use a stronger password with at least six characters.";
      case "auth/network-request-failed":
        return "The password reset request failed because the network is unavailable.";
      default:
        return "This password reset link could not be used.";
    }
  };

  const init = async () => {
    if (!window.firebase || !firebaseConfig.apiKey) {
      copy.textContent = "Password reset is unavailable because Firebase is not configured.";
      setStatus("Try again later.", "error");
      return;
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    if (mode && mode !== "resetPassword") {
      copy.textContent = "This link is not a password reset link.";
      setStatus("Request a password reset email from the sign-in window.", "error");
      return;
    }

    if (!oobCode) {
      copy.textContent = "This reset link is missing its secure code.";
      setStatus("Request a new password reset email.", "error");
      return;
    }

    try {
      const email = await window.firebase.auth().verifyPasswordResetCode(oobCode);
      copy.textContent = `Choose a new password for ${email}.`;
      form.hidden = false;
      setStatus("");
    } catch (error) {
      copy.textContent = "This reset link cannot be used.";
      setStatus(getFriendlyResetError(error), "error");
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
      await window.firebase.auth().confirmPasswordReset(oobCode, password);
      form.hidden = true;
      copy.textContent = "Your password has been updated.";
      setStatus("Success. You can now sign in with your new password.", "success");
    } catch (error) {
      setStatus(getFriendlyResetError(error), "error");
    }
  });

  init();
})();
