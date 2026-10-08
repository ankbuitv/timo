# Import / Export JSON (KẾ HOẠCH – CHƯA TRIỂN KHAI)

> Chưa có endpoint import trong phiên bản hiện tại. Tài liệu mô tả thiết kế dự kiến.

## Phạm vi dự kiến

Nhập: lớp, môn, danh mục, khóa học (module → chương → bài → hoạt động), video, tài liệu, bài tập, câu hỏi, giải thích, sách, bài blog.
Xuất: JSON của các thực thể trên (không gồm bí mật, không gồm dữ liệu cá nhân học sinh).

## Định dạng

```json
{
  "schemaVersion": "1.0",
  "courses": [
    {
      "title": "Toán 10",
      "grade": 10,
      "subject": "toan",
      "chapters": [
        {
          "title": "Mệnh đề",
          "lessons": [{ "title": "Mệnh đề toán học", "content": [], "videos": [], "questions": [] }]
        }
      ]
    }
  ]
}
```

## Yêu cầu thiết kế

1. **Hai bước:** `validate` (trả về preview + lỗi theo đường dẫn JSON) → `commit` (ghi thật). Lỗi có số dòng/đường dẫn.
2. **Schema version:** từ chối phiên bản không hỗ trợ; có chuyển đổi cho các phiên bản cũ.
3. **Phát hiện trùng:** theo slug/khóa tự nhiên; chính sách xử lý: bỏ qua, cập nhật, hoặc tạo bản mới (người dùng chọn).
4. **Transaction:** D1 `batch()` là một transaction; chia batch để không vượt giới hạn Worker (CPU/thời gian) và giới hạn dòng ghi của free tier.
5. **Tiến trình:** job lưu trong D1 (`import_jobs`) với trạng thái và số bản ghi đã xử lý; client hỏi trạng thái định kỳ.
6. **Nguồn URL:** chỉ `https`; chặn IP nội bộ, localhost, metadata endpoint và chuyển hướng tới đích nội bộ; giới hạn kích thước và thời gian.
7. **Quyền:** `content:import` (hoặc `courses:create` + duyệt); ghi nhật ký.

## Trạng thái

Chưa có: schema Zod cho khóa học, endpoint, UI, kiểm thử. Khi triển khai, mục này sẽ được cập nhật với ví dụ và giới hạn thực tế.
