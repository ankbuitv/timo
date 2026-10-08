/**
 * Minh họa "góc học tập TIMO" – vẽ hoàn toàn bằng SVG gốc của dự án.
 * Không sử dụng hình ảnh, logo hay tài sản của bên thứ ba.
 * Đây là hình trang trí (aria-hidden) nên không truyền tải thông tin chỉ có ở hình.
 */
export function LearningScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ls-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="ls-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6258F5" stopOpacity="0.22" />
          <stop offset="1" stopColor="#6258F5" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ls-book" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Nền sáng phía sau */}
      <ellipse cx="320" cy="250" rx="250" ry="170" fill="url(#ls-glow)" />

      {/* Bàn học */}
      <rect x="70" y="330" width="500" height="16" rx="8" fill="#E2E8F0" />
      <rect x="104" y="346" width="14" height="96" rx="7" fill="#CBD5E1" />
      <rect x="522" y="346" width="14" height="96" rx="7" fill="#CBD5E1" />

      {/* Máy tính bảng dựng đứng */}
      <rect x="300" y="150" width="260" height="176" rx="18" fill="#1E293B" />
      <rect x="310" y="160" width="240" height="156" rx="12" fill="url(#ls-screen)" />
      {/* Nội dung trên màn hình: bài học + tiến độ */}
      <rect x="330" y="182" width="120" height="12" rx="6" fill="#6258F5" />
      <rect x="330" y="206" width="200" height="9" rx="4.5" fill="#94A3B8" />
      <rect x="330" y="224" width="164" height="9" rx="4.5" fill="#CBD5E1" />
      <rect x="330" y="252" width="200" height="10" rx="5" fill="#E2E8F0" />
      <rect x="330" y="252" width="128" height="10" rx="5" fill="#3B82F6" />
      <rect x="330" y="280" width="88" height="22" rx="11" fill="#FF8747" />
      {/* Thẻ ghi chú nhỏ nổi trên màn hình */}
      <g>
        <rect x="470" y="126" width="104" height="46" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
        <circle cx="490" cy="149" r="8" fill="#10B981" />
        <rect x="504" y="140" width="56" height="7" rx="3.5" fill="#CBD5E1" />
        <rect x="504" y="153" width="40" height="7" rx="3.5" fill="#E2E8F0" />
      </g>

      {/* Sách mở */}
      <g>
        <path d="M96 300c34-18 68-18 102 0v46c-34-16-68-16-102 0z" fill="url(#ls-book)" />
        <path d="M198 300c34-18 68-18 102 0v46c-34-16-68-16-102 0z" fill="#F1F5F9" />
        <path d="M198 300v46" stroke="#CBD5E1" strokeWidth="3" />
        <rect x="118" y="316" width="60" height="6" rx="3" fill="#CBD5E1" />
        <rect x="118" y="328" width="44" height="6" rx="3" fill="#E2E8F0" />
        <rect x="220" y="316" width="60" height="6" rx="3" fill="#CBD5E1" />
        <rect x="220" y="328" width="48" height="6" rx="3" fill="#E2E8F0" />
      </g>

      {/* Cốc nước */}
      <path d="M560 282h34l-5 46a10 10 0 0 1-10 9h-4a10 10 0 0 1-10-9z" fill="#E2E8F0" />
      <path d="M562 292h30l-3 22h-24z" fill="#BFDBFE" />

      {/* Bút chì */}
      <g transform="rotate(-18 118 300)">
        <rect x="60" y="292" width="96" height="14" rx="7" fill="#FF8747" />
        <path d="M156 292l22 7-22 7z" fill="#FCD9A8" />
        <rect x="52" y="292" width="12" height="14" rx="6" fill="#F06B25" />
      </g>

      {/* Hình khối kiến thức bay lên */}
      <g opacity="0.95">
        <circle cx="150" cy="132" r="26" fill="#10B981" />
        <text
          x="150"
          y="141"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill="#FFFFFF"
        >
          1
        </text>
      </g>
      <g opacity="0.95">
        <rect x="212" y="86" width="52" height="52" rx="16" fill="#3B82F6" />
        <text
          x="238"
          y="122"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill="#FFFFFF"
        >
          2
        </text>
      </g>
      <g opacity="0.95">
        <path d="M300 76l30 17v34l-30 17-30-17V93z" fill="#FF8747" />
        <text
          x="300"
          y="118"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill="#FFFFFF"
        >
          3
        </text>
      </g>
      {/* Ngôi sao nhỏ */}
      <path d="M112 228l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#FBBF24" />
    </svg>
  );
}
