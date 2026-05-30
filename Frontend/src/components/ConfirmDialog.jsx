const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const confirmClass = variant === "danger" ? "btn-error" : "btn-primary";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost rounded-2xl" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={`btn ${confirmClass} rounded-2xl`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;