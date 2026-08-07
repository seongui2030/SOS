export const EMERGENCY_KEYWORDS = [
  "응급",
  "구급차",
  "119",
  "살려",
  "도와주세요",
  "숨이 안",
  "숨을 못",
  "호흡곤란",
  "가슴이 아파",
  "가슴 통증",
  "쓰러",
  "넘어졌",
  "낙상",
  "의식이 없",
  "피가 멈추지",
  "심한 출혈",
  "마비",
  "말이 어눌",
  "발작",
  "경련",
];

export function detectEmergency(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  return EMERGENCY_KEYWORDS.filter((k) => normalized.includes(k));
}
