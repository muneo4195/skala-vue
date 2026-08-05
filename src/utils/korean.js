// 한글 음절의 받침 유무로 조사(이/가 등)를 골라줌.
// 완성형 한글 음절은 U+AC00~U+D7A3 범위이고, (코드 - 0xAC00) % 28 이
// 0이면 받침 없음, 아니면 받침 있음
function hasBatchim(word) {
  if (!word) return false
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

// "남양주" + 가/이 -> "남양주가", "성남" + 가/이 -> "성남이"
export function withSubjectParticle(word) {
  return `${word}${hasBatchim(word) ? '이' : '가'}`
}
