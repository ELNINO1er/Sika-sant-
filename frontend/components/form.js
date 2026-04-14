export function bindAsyncForm({ form, submitButton, idleLabel, pendingLabel, onSubmit, onSuccess, onError }) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${pendingLabel}`;

    try {
      const result = await onSubmit(event);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = idleLabel;
    }
  });
}
