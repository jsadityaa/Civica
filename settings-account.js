(() => {
  const signedOutPanel = document.querySelector(".account-settings__signed-out");
  const signedInPanel = document.querySelector(".account-settings__signed-in");
  const emailText = document.querySelector(".account-settings__email");
  const verificationText = document.querySelector(".account-settings__verification");
  const roleText = document.querySelector(".account-settings__role");
  const statusText = document.querySelector(".account-settings__status");
  const statusRow = document.querySelector(".account-settings__message-row");
  const displayNameInput = document.getElementById("account-display-name");
  const saveNameButton = document.getElementById("account-save-name");
  const photoFileInput = document.getElementById("account-photo-file");
  const photoPreview = document.querySelector(".account-settings__picture-preview");
  const uploadPhotoButton = document.getElementById("account-upload-photo");
  const verificationButton = document.getElementById("account-send-verification");
  const resetPasswordButton = document.getElementById("account-reset-password");
  const signUpButton = document.querySelector("[data-settings-signup]");
  const settingsParams = new URLSearchParams(window.location.search);
  let isRefreshingUser = false;

  if (!signedOutPanel || !signedInPanel) return;

  const withTimeout = (promise, message, timeoutMs = 12000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  };

  const setStatus = (message, type = "neutral") => {
    if (!statusText) return;
    statusText.textContent = message;
    statusText.dataset.status = type;
    if (statusRow) {
      statusRow.hidden = !message;
      statusRow.style.display = message ? "block" : "none";
    }
  };

  const getLiveFirebaseUser = () => {
    try {
      if (!window.firebase || typeof window.firebase.auth !== "function") {
        return null;
      }

      return window.firebase.auth().currentUser || null;
    } catch (error) {
      return null;
    }
  };

  const render = () => {
    const authApi = window.POLYCIVIC_AUTH;
    const liveUser = getLiveFirebaseUser();
    const cachedUser = authApi && typeof authApi.getCurrentUser === "function"
      ? authApi.getCurrentUser()
      : null;
    const user = liveUser || cachedUser;
    const profile = authApi && typeof authApi.getCurrentProfile === "function"
      ? authApi.getCurrentProfile()
      : null;

    signedOutPanel.hidden = !!user;
    signedInPanel.hidden = !user;

    if (!user) return;

    if (displayNameInput) {
      displayNameInput.value = user.displayName || "";
    }

    if (emailText) {
      emailText.textContent = user.email || "No email address available.";
    }

    if (photoPreview) {
      if (user.photoURL) {
        photoPreview.style.backgroundImage = `url("${user.photoURL}")`;
        photoPreview.textContent = "";
      } else {
        photoPreview.style.backgroundImage = "";
        photoPreview.textContent = (user.displayName || user.email || "A").trim().charAt(0).toUpperCase() || "A";
      }
    }

    if (verificationText) {
      const verified = liveUser ? !!liveUser.emailVerified : !!user.emailVerified;
      verificationText.textContent = verified ? "Verified" : "Your email is not verified yet.";
      verificationText.classList.toggle("account-settings__verification--verified", verified);
    }

    if (verificationButton) {
      const verified = liveUser ? !!liveUser.emailVerified : !!user.emailVerified;
      verificationButton.hidden = verified;
    }

    if (roleText) {
      roleText.textContent = `Current role: ${profile?.role || "user"}`;
    }

    if (settingsParams.get("verified") === "email" && user.emailVerified) {
      setStatus("Email verified.", "success");
      window.history.replaceState({}, "", window.location.pathname);
      settingsParams.delete("verified");
    }
  };

  const refreshCurrentUser = async () => {
    if (isRefreshingUser) {
      return;
    }

    const liveUser = getLiveFirebaseUser();
    if (!liveUser) {
      render();
      return;
    }

    isRefreshingUser = true;
    try {
      await liveUser.reload();
      if (typeof window.POLYCIVIC_AUTH?.reloadCurrentUser === "function") {
        await window.POLYCIVIC_AUTH.reloadCurrentUser();
      }
      render();
    } catch (error) {
      console.warn("Polycivic email verification refresh failed:", error);
    } finally {
      isRefreshingUser = false;
    }
  };

  signUpButton?.addEventListener("click", () => {
    window.POLYCIVIC_AUTH?.openSignUp?.();
  });

  saveNameButton?.addEventListener("click", async () => {
    setStatus("Saving changes...", "neutral");
    saveNameButton.disabled = true;
    try {
      if (typeof window.POLYCIVIC_AUTH?.updateDisplayName !== "function") {
        throw new Error("Account settings are still loading. Try again in a moment.");
      }

      await window.POLYCIVIC_AUTH.updateDisplayName(displayNameInput.value);
      setStatus("Changes saved! Refresh to see the changes!", "success");
      render();
    } catch (error) {
      setStatus(error.message || "Your profile could not be updated.", "error");
    } finally {
      saveNameButton.disabled = false;
    }
  });

  photoFileInput?.addEventListener("change", () => {
    const file = photoFileInput.files && photoFileInput.files[0];
    if (!file || !photoPreview) return;

    photoPreview.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
    photoPreview.textContent = "";
  });

  uploadPhotoButton?.addEventListener("click", async () => {
    const file = photoFileInput?.files && photoFileInput.files[0];
    setStatus("Uploading profile picture...", "neutral");
    uploadPhotoButton.disabled = true;
    try {
      if (typeof window.POLYCIVIC_AUTH?.uploadProfilePicture !== "function") {
        throw new Error("Profile picture uploads are still loading. Try again in a moment.");
      }

      await withTimeout(
        window.POLYCIVIC_AUTH.uploadProfilePicture(file),
        "Your profile picture upload timed out. Try a smaller image or try again."
      );
      setStatus("Profile picture saved! Refresh to see the changes!", "success");
      render();
    } catch (error) {
      setStatus(error.message || "Your profile picture could not be uploaded.", "error");
    } finally {
      uploadPhotoButton.disabled = false;
    }
  });

  verificationButton?.addEventListener("click", async () => {
    setStatus("");
    try {
      await window.POLYCIVIC_AUTH?.sendVerificationEmail?.();
      setStatus("Verification email sent.", "success");
    } catch (error) {
      setStatus(error.message || "Verification email could not be sent.", "error");
    }
  });

  resetPasswordButton?.addEventListener("click", async () => {
    setStatus("");
    try {
      await window.POLYCIVIC_AUTH?.sendPasswordReset?.();
      setStatus("Password reset email sent.", "success");
    } catch (error) {
      setStatus(error.message || "Password reset email could not be sent.", "error");
    }
  });

  window.addEventListener("polycivic-auth-changed", render);
  window.addEventListener("polycivic-auth-changed", refreshCurrentUser);
  window.addEventListener("focus", refreshCurrentUser);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshCurrentUser();
    }
  });
  render();
  window.setTimeout(refreshCurrentUser, 250);
  window.setTimeout(refreshCurrentUser, 1500);
})();
