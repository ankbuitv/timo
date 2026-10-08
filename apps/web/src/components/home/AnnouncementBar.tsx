import { useState } from "react";
import { Megaphone, X } from "lucide-react";

const DISMISS_KEY = "timo-announcement-dismissed";

/** Thanh thông báo cấu hình từ CMS. Người dùng có thể ẩn; lựa chọn lưu theo nội dung thông báo. */
export function AnnouncementBar({
  message,
  tone,
}: {
  message: string;
  tone: "info" | "success" | "warning";
}) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === message;
    } catch {
      return false;
    }
  });
  if (dismissed) return null;
  const toneClass = {
    info: "bg-brand-500 text-white",
    success: "bg-success-600 text-white",
    warning: "bg-accent-500 text-white",
  }[tone];
  return (
    <div role="region" aria-label="Thông báo" className={`${toneClass}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm font-medium sm:px-6">
        <Megaphone className="size-4 shrink-0" aria-hidden="true" />
        <p className="flex-1">{message}</p>
        <button
          type="button"
          aria-label="Ẩn thông báo"
          onClick={() => {
            try {
              window.localStorage.setItem(DISMISS_KEY, message);
            } catch {
              /* bỏ qua */
            }
            setDismissed(true);
          }}
          className="rounded-md p-1 hover:bg-white/15"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
