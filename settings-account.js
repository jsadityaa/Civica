(() => {
  const signedOutPanel = document.querySelector(".account-settings__signed-out");
  const signedInPanel = document.querySelector(".account-settings__signed-in");
  const emailText = document.querySelector(".account-settings__email");
  const verificationText = document.querySelector(".account-settings__verification");
  const statusText = document.querySelector(".account-settings__status");
  const statusRow = document.querySelector(".account-settings__message-row");
  const displayNameInput = document.getElementById("account-display-name");
  const usernameInput = document.getElementById("account-username");
  const bioInput = document.getElementById("account-bio");
  const saveNameButton = document.getElementById("account-save-name");
  const profileNameInput = document.getElementById("account-profile-name-inline");
  const profileNameEditor = document.querySelector(".account-settings__profile-name-editor");
  const photoFileInput = document.getElementById("account-photo-file");
  const photoPreview = document.querySelector(".account-settings__picture-preview");
  const uploadPhotoButton = document.getElementById("account-upload-photo");
  const verificationButton = document.getElementById("account-send-verification");
  const resetPasswordButton = document.getElementById("account-reset-password");
  const signUpButton = document.querySelector("[data-settings-signup]");
  const settingsParams = new URLSearchParams(window.location.search);
  let isRefreshingUser = false;
  let isEditingInlineName = false;
  let isEditingProfileDetails = false;
  let savedProfileDetails = null;
  let selectedPhotoPreviewUrl = "";
  const profileNameMeasureCanvas = document.createElement("canvas");

  if (!signedOutPanel || !signedInPanel) return;

  const withTimeout = (promise, message, timeoutMs = 45000) => {
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

  const syncProfileNameWidth = () => {
    if (!profileNameInput) return;
    const name = (profileNameInput.value || "Profile").trim() || "Profile";
    const styles = window.getComputedStyle(profileNameInput);
    const context = profileNameMeasureCanvas.getContext("2d");
    context.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
    const padding = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const editorWidth = profileNameEditor?.getBoundingClientRect().width || 620;
    const maxInputWidth = Math.max(180, editorWidth - 24);
    const measuredWidth = Math.ceil(context.measureText(name).width + padding + 10);
    const inputWidth = Math.min(Math.max(measuredWidth, 180), maxInputWidth);
    profileNameInput.style.setProperty("--profile-name-width", `${inputWidth}px`);
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
    const user = cachedUser || liveUser;
    const profile = authApi && typeof authApi.getCurrentProfile === "function"
      ? authApi.getCurrentProfile()
      : null;

    signedOutPanel.hidden = !!user;
    signedInPanel.hidden = !user;

    if (!user) return;

    if (!isEditingProfileDetails) {
      const fallbackName = user.email ? user.email.split("@")[0] : "Profile";
      const fallbackUsername = user.email
        ? user.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 30)
        : "";

      if (displayNameInput) {
        displayNameInput.value = (savedProfileDetails?.displayName || user.displayName || profile?.displayName || fallbackName).trim();
      }

      if (usernameInput) {
        usernameInput.value = savedProfileDetails?.username || profile?.username || fallbackUsername;
      }

      if (bioInput) {
        bioInput.value = Object.prototype.hasOwnProperty.call(savedProfileDetails || {}, "bio")
          ? savedProfileDetails.bio || ""
          : profile?.bio || "";
      }
    }

    if (profileNameInput && !isEditingInlineName) {
      const fallbackName = user.email ? user.email.split("@")[0] : "Profile";
      profileNameInput.value = (user.displayName || profile?.displayName || fallbackName).trim();
      syncProfileNameWidth();
    }

    if (emailText) {
      emailText.textContent = user.email || "No email address available.";
    }

    if (photoPreview) {
      const photoURL = selectedPhotoPreviewUrl || cachedUser?.photoURL || user.photoURL || "";
      if (photoURL) {
        photoPreview.style.backgroundImage = `url("${photoURL}")`;
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

  const saveDisplayName = async (nextName) => {
    setStatus("Saving changes...", "neutral");
    if (saveNameButton) saveNameButton.disabled = true;
    try {
      if (typeof window.POLYCIVIC_AUTH?.updateDisplayName !== "function") {
        throw new Error("Account settings are still loading. Try again in a moment.");
      }

      await window.POLYCIVIC_AUTH.updateDisplayName(nextName);
      if (displayNameInput) displayNameInput.value = nextName;
      if (profileNameInput) profileNameInput.value = nextName;
      syncProfileNameWidth();
      setStatus("Changes saved!", "success");
      render();
    } catch (error) {
      setStatus(error.message || "Your profile could not be updated.", "error");
    } finally {
      if (saveNameButton) saveNameButton.disabled = false;
    }
  };

  const finishInlineNameEdit = async () => {
    if (!profileNameInput || !isEditingInlineName) return;
    const nextName = profileNameInput.value.trim();
    isEditingInlineName = false;
    profileNameInput.classList.remove("is-editing");

    if (!nextName) {
      render();
      return;
    }

    await saveDisplayName(nextName);
  };

  profileNameInput?.addEventListener("focus", () => {
    isEditingInlineName = true;
    profileNameInput.classList.add("is-editing");
  });

  profileNameInput?.addEventListener("input", () => {
    isEditingInlineName = true;
    profileNameInput.classList.add("is-editing");
    syncProfileNameWidth();
    if (displayNameInput && isEditingInlineName) {
      displayNameInput.value = profileNameInput.value;
    }
  });

  profileNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finishInlineNameEdit();
    }

    if (event.key === "Escape") {
      isEditingInlineName = false;
      profileNameInput.classList.remove("is-editing");
      render();
    }
  });

  profileNameInput?.addEventListener("blur", () => {
    finishInlineNameEdit();
  });

  [displayNameInput, usernameInput, bioInput].forEach((field) => {
    field?.addEventListener("input", () => {
      isEditingProfileDetails = true;
    });
  });

  saveNameButton?.addEventListener("click", async () => {
    const nextName = displayNameInput?.value.trim() || profileNameInput?.value.trim() || "";
    const nextUsername = usernameInput?.value.trim() || "";
    const nextBio = bioInput?.value.trim() || "";
    savedProfileDetails = {
      displayName: nextName,
      username: nextUsername,
      bio: nextBio
    };

    setStatus("Saving changes...", "neutral");
    if (saveNameButton) saveNameButton.disabled = true;

    try {
      if (typeof window.POLYCIVIC_AUTH?.updateProfileDetails !== "function") {
        throw new Error("Profile settings are still loading. Try again in a moment.");
      }

      const updatedProfile = await window.POLYCIVIC_AUTH.updateProfileDetails({
        displayName: nextName,
        username: nextUsername,
        bio: nextBio
      });

      if (profileNameInput) {
        profileNameInput.value = nextName;
      }
      savedProfileDetails = {
        displayName: updatedProfile?.displayName || nextName,
        username: updatedProfile?.username || nextUsername,
        bio: Object.prototype.hasOwnProperty.call(updatedProfile || {}, "bio")
          ? updatedProfile.bio || ""
          : nextBio
      };
      syncProfileNameWidth();
      isEditingProfileDetails = false;
      render();
      if (displayNameInput) {
        displayNameInput.value = updatedProfile?.displayName || nextName;
      }
      if (usernameInput) {
        usernameInput.value = updatedProfile?.username || nextUsername;
      }
      if (bioInput) {
        bioInput.value = Object.prototype.hasOwnProperty.call(updatedProfile || {}, "bio")
          ? updatedProfile.bio || ""
          : nextBio;
      }
      setStatus("Changes saved!", "success");
    } catch (error) {
      setStatus(error.message || "Your profile could not be updated.", "error");
    } finally {
      if (saveNameButton) saveNameButton.disabled = false;
    }
  });

  photoFileInput?.addEventListener("change", () => {
    const file = photoFileInput.files && photoFileInput.files[0];
    if (!file || !photoPreview) return;

    if (selectedPhotoPreviewUrl) {
      URL.revokeObjectURL(selectedPhotoPreviewUrl);
    }

    selectedPhotoPreviewUrl = URL.createObjectURL(file);
    photoPreview.style.backgroundImage = `url("${selectedPhotoPreviewUrl}")`;
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

      const photoURL = await withTimeout(
        window.POLYCIVIC_AUTH.uploadProfilePicture(file),
        "Your profile picture upload timed out. Try a smaller image or try again."
      );
      if (photoPreview && photoURL) {
        if (selectedPhotoPreviewUrl) {
          URL.revokeObjectURL(selectedPhotoPreviewUrl);
          selectedPhotoPreviewUrl = "";
        }
        photoPreview.style.backgroundImage = `url("${photoURL}")`;
        photoPreview.textContent = "";
      }
      setStatus("Profile picture saved!", "success");
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
