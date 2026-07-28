(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const status = document.querySelector('#contact-form-status');
  const submitButton = form.querySelector('.contact-page__submit');

  const fields = {
    name: form.querySelector('#contact-name'),
    email: form.querySelector('#contact-email'),
    category: form.querySelector('#contact-category'),
    subject: form.querySelector('#contact-subject'),
    message: form.querySelector('#contact-message')
  };

  const authConfig = window.POLYCIVIC_AUTH_CONFIG || {};
  const firebaseConfig = authConfig.firebase || {};
  const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const isFirebaseConfigured = requiredFirebaseKeys.every((key) => {
    return typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim();
  });

  let db = null;

  const setStatus = (message, state = 'idle') => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('is-error', 'is-success', 'is-working');

    if (state === 'error') status.classList.add('is-error');
    if (state === 'success') status.classList.add('is-success');
    if (state === 'working') status.classList.add('is-working');
  };

  const setSubmitting = (submitting) => {
    submitButton.disabled = submitting;
    submitButton.textContent = submitting ? 'Submitting…' : 'Submit';
  };

  const resetFieldValidity = () => {
    Object.values(fields).forEach((field) => {
      if (field) field.setCustomValidity('');
    });
  };

  const validate = () => {
    resetFieldValidity();

    if (!fields.name.value.trim()) {
      fields.name.setCustomValidity('Please enter your name.');
      fields.name.reportValidity();
      return false;
    }

    if (!fields.email.value.trim()) {
      fields.email.setCustomValidity('Please enter your email address.');
      fields.email.reportValidity();
      return false;
    }

    if (!fields.email.checkValidity()) {
      fields.email.setCustomValidity('Please enter a valid email address.');
      fields.email.reportValidity();
      return false;
    }

    if (!fields.subject.value.trim()) {
      fields.subject.setCustomValidity('Please enter a subject.');
      fields.subject.reportValidity();
      return false;
    }

    if (!fields.message.value.trim()) {
      fields.message.setCustomValidity('Please enter a message.');
      fields.message.reportValidity();
      return false;
    }

    return true;
  };

  const initFirestore = () => {
    if (!window.firebase || !window.firebase.firestore || !isFirebaseConfigured) {
      return null;
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    return window.firebase.firestore();
  };

  db = initFirestore();

  if (!db) {
    setStatus('Contact submissions are temporarily unavailable until Firebase is available on this page.', 'error');
  } else {
    setStatus('Your message will be submitted directly to Polycivic.', 'idle');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validate()) {
      setStatus('Please complete all required fields before submitting.', 'error');
      return;
    }

    if (!db) {
      setStatus('This form cannot submit right now because the database connection is unavailable.', 'error');
      return;
    }

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      category: fields.category.value.trim(),
      subject: fields.subject.value.trim(),
      message: fields.message.value.trim(),
      submittedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      submittedAtISO: new Date().toISOString(),
      page: window.location.pathname || '/contact',
      userAgent: navigator.userAgent
    };

    try {
      setSubmitting(true);
      setStatus('Submitting your message…', 'working');

      await db.collection('contactSubmissions').add(payload);

      form.reset();
      resetFieldValidity();
      setStatus('Message sent successfully. Your submission has been saved.', 'success');
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus('Submission failed. Please try again in a moment or contact us directly below.', 'error');
    } finally {
      setSubmitting(false);
    }
  });
})();
