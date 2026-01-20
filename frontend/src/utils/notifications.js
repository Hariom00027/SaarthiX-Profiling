const dispatchToast = (type, message) => {
  if (!message) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: {
        type,
        message,
      },
    }),
  );
};

export const notifyError = (message) => {
  dispatchToast('error', message);
};

export const notifySuccess = (message) => {
  dispatchToast('success', message);
};













