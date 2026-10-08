import { Button, Dialog } from "../ui";

/** Xác nhận trước thao tác phá hủy. Nút xác nhận hiển thị trạng thái đang xử lý. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xóa",
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--text-muted)]">
        Thao tác này không thể hoàn tác. Hành động sẽ được ghi vào nhật ký.
      </p>
    </Dialog>
  );
}
