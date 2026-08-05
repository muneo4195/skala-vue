// 기상청 표기 관례를 따라 16방위 한글 라벨로 변환 (풍향 컴퍼스에서 사용)
const DIRECTIONS = [
  '북', '북북동', '북동', '동북동',
  '동', '동남동', '남동', '남남동',
  '남', '남남서', '남서', '서남서',
  '서', '서북서', '북서', '북북서',
]

export function getCompassLabel(deg) {
  if (deg === undefined || deg === null || Number.isNaN(deg)) return '-'
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16
  return DIRECTIONS[index]
}
