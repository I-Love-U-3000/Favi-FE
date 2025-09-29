// Regex: 2-20 ký tự, chỉ [a-z0-9._-], không bắt đầu/kết thúc bằng dấu
export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{0,18}[a-z0-9])$/;

// Không cho lặp dấu
export const BAD_SEQ = /(--)|(__)|(\.\.)/;

// Chuẩn hoá: trim, lower, bỏ dấu
export function normalizeUsername(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function isValidUsername(s: string) {
  return USERNAME_RE.test(s) && !BAD_SEQ.test(s);
}
