// Member-facing UI strings — EN default / 中文 / BM (spec §2.5). This is platform
// CHROME only. Tenant-authored content (reward names, tier names) lives in the DB and
// renders as-is in every language, exactly like reward names already do; admin is
// EN-only per the hard rule, so those words are never translated here.
//
// `en` is the canonical key set: `Dictionary` is derived from it, so `zh`/`ms` fail to
// typecheck if a key is missing or extra. A runtime completeness test backs this up.
//
// Templates use {name} placeholders filled by `interpolate` (see ./index).

export const en = {
  membership: "Membership",

  // enrol / lookup
  phoneLabel: "Your phone number",
  enter: "Enter",
  badPhone: "That doesn’t look like a Malaysian mobile number.",
  noMemberFound: "No member found for {phone}.",
  signOut: "Not you?",

  // hero card
  points: "points",
  ptsUnit: "pts",
  qrHint: "tap to enlarge",
  memberCode: "Member code",
  scanToEarn: "Scan at the counter to earn points",
  done: "Done",

  // tier journey
  tierProgress: "{points} points to {tier}",
  tierTop: "You’ve reached {tier} — our highest tier",

  // sections
  rewards: "Rewards",
  history: "History",
  noRewards: "No rewards yet.",
  noActivity: "No activity yet.",

  // redeem
  redeem: "Redeem",
  insufficientPoints: "Not enough points for that reward.",
  activeVoucherBlock: "Finish or wait out your active voucher before redeeming another.",
  confirmTitle: "Redeem this reward?",
  confirmBody:
    "Only continue when you're at the counter and ready to use it now.\nThe code stays valid for 3 minutes.\nUnused codes are not refunded.",
  confirm: "Confirm",
  cancel: "Cancel",

  // voucher
  showToStaff: "Show this to staff",
  oneTimeCode: "{points} points · one-time code",
  validFor: "Valid for",
  expired: "Expired",
  expiredSub: "This code has expired.",
  generateNewCode: "Generate a new code",
  voucherUsed: "Used — this voucher has been redeemed.",
  voucherNotFound: "Voucher not found.",
  tapToView: "Tap to view",

  // history rows
  visit: "Visit",
  redeemed: "Redeemed",
  showLess: "Show less",
  showAll: "Show all {count}",

  // chrome
  close: "Close",
  footer: "{tenant} Membership · Protected under PDPA",
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string>;

export const zh: Dictionary = {
  membership: "会员",

  phoneLabel: "您的手机号码",
  enter: "进入",
  badPhone: "这似乎不是有效的马来西亚手机号码。",
  noMemberFound: "找不到 {phone} 的会员。",
  signOut: "不是您？",

  points: "积分",
  ptsUnit: "分",
  qrHint: "点击放大",
  memberCode: "会员码",
  scanToEarn: "在柜台扫描即可赚取积分",
  done: "完成",

  tierProgress: "还差 {points} 分升级 {tier}",
  tierTop: "您已达到 {tier} — 最高等级",

  rewards: "奖励",
  history: "记录",
  noRewards: "暂无奖励。",
  noActivity: "暂无活动记录。",

  redeem: "兑换",
  insufficientPoints: "积分不足，无法兑换该奖励。",
  activeVoucherBlock: "请先完成或等待当前券失效，才能再次兑换。",
  confirmTitle: "确定兑换此奖励？",
  confirmBody:
    "请在柜台前、准备好立即使用时才继续。\n代码有效期为 3 分钟。\n未使用的代码不予退还积分。",
  confirm: "确认",
  cancel: "取消",

  showToStaff: "出示给店员",
  oneTimeCode: "{points} 积分 · 一次性代码",
  validFor: "有效时间",
  expired: "已过期",
  expiredSub: "此代码已过期。",
  generateNewCode: "重新生成代码",
  voucherUsed: "已使用 — 此券已兑换。",
  voucherNotFound: "找不到此券。",
  tapToView: "点击查看",

  visit: "到店",
  redeemed: "已兑换",
  showLess: "收起",
  showAll: "查看全部 {count} 条",

  close: "关闭",
  footer: "{tenant} 会员 · 受 PDPA 保护",
};

export const ms: Dictionary = {
  membership: "Keahlian",

  phoneLabel: "Nombor telefon anda",
  enter: "Masuk",
  badPhone: "Itu tidak kelihatan seperti nombor telefon bimbit Malaysia.",
  noMemberFound: "Tiada ahli ditemui untuk {phone}.",
  signOut: "Bukan anda?",

  points: "mata",
  ptsUnit: "mata",
  qrHint: "klik besarkan",
  memberCode: "Kod ahli",
  scanToEarn: "Imbas di kaunter untuk kumpul mata",
  done: "Selesai",

  tierProgress: "{points} mata lagi ke {tier}",
  tierTop: "Anda telah mencapai {tier} — tahap tertinggi",

  rewards: "Ganjaran",
  history: "Sejarah",
  noRewards: "Tiada ganjaran lagi.",
  noActivity: "Tiada aktiviti lagi.",

  redeem: "Tebus",
  insufficientPoints: "Mata tidak mencukupi untuk ganjaran itu.",
  activeVoucherBlock: "Selesaikan atau tunggu baucar aktif tamat sebelum menebus yang lain.",
  confirmTitle: "Tebus ganjaran ini?",
  confirmBody:
    "Teruskan hanya apabila anda berada di kaunter dan bersedia menggunakannya sekarang.\nKod ini sah selama 3 minit.\nKod yang tidak digunakan tidak dikembalikan.",
  confirm: "Sahkan",
  cancel: "Batal",

  showToStaff: "Tunjukkan kepada kakitangan",
  oneTimeCode: "{points} mata · kod sekali guna",
  validFor: "Sah selama",
  expired: "Tamat tempoh",
  expiredSub: "Kod ini telah tamat tempoh.",
  generateNewCode: "Jana kod baharu",
  voucherUsed: "Digunakan — baucar ini telah ditebus.",
  voucherNotFound: "Baucar tidak ditemui.",
  tapToView: "Klik untuk lihat",

  visit: "Kunjungan",
  redeemed: "Ditebus",
  showLess: "Tunjuk kurang",
  showAll: "Tunjuk semua {count}",

  close: "Tutup",
  footer: "Keahlian {tenant} · Dilindungi di bawah PDPA",
};

export type Locale = "en" | "zh" | "ms";

export const DEFAULT_LOCALE: Locale = "en";

export const DICTIONARIES: Record<Locale, Dictionary> = { en, zh, ms };

// Toggle metadata: `short` is the segmented-control label, `label` the accessible name.
export const LOCALES = [
  { code: "en", short: "EN", label: "English" },
  { code: "zh", short: "中", label: "中文" },
  { code: "ms", short: "BM", label: "Bahasa Melayu" },
] as const satisfies ReadonlyArray<{ code: Locale; short: string; label: string }>;
