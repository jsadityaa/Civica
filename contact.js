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

  const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/support@polycivic.com';

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

  setStatus('Your message will be delivered directly to support@polycivic.com.', 'idle');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validate()) {
      setStatus('Please complete all required fields before submitting.', 'error');
      return;
    }

    const payload = new FormData();
    payload.append('name', fields.name.value.trim());
    payload.append('email', fields.email.value.trim());
    payload.append('category', fields.category.value.trim());
    payload.append('subject', fields.subject.value.trim());
    payload.append('message', fields.message.value.trim());
    payload.append('_subject', 'New Polycivic contact form submission');
    payload.append('_template', 'table');
    payload.append('_captcha', 'true');
    payload.append('_honey', '');

    try {
      setSubmitting(true);
      setStatus('Submitting your message…', 'working');

      const response = await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: payload
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'The contact service rejected the submission.');
      }

      form.reset();
      resetFieldValidity();
      setStatus('Success!', 'success');
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus('Your message could not be sent.', 'error');
    } finally {
      setSubmitting(false);
    }
  });
})();
