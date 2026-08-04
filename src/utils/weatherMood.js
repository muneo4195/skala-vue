import { ICONS } from './icons'
import { getWeatherTheme } from './weatherTheme'

// 시간대 + 날씨 상태를 함께 고려한 감성 한 줄 문구 (히어로 섹션 / 상세보기에서 공유)
const MOOD_LINES = {
  dawn: {
    default: '차분한 새벽 공기와 함께 시작하는 하루예요',
    맑음: '맑은 새벽하늘 아래 고요한 아침이에요',
    비: '빗소리로 조용히 시작하는 새벽이에요',
    눈: '새벽부터 하얗게 눈이 쌓이고 있어요',
    안개: '뿌연 안개가 낀 몽환적인 새벽이에요',
  },
  morning: {
    default: '상쾌하게 하루를 시작하기 좋은 아침이에요',
    맑음: '햇살이 포근하게 내려앉는 완벽한 산책 날씨예요',
    '구름 조금': '군데군데 흰 구름이 떠 있는 상쾌한 아침이에요',
    비: '창밖에 빗소리가 조용히 울리는 아침이에요',
    눈: '하얀 눈이 소복하게 내리는 아침이에요',
  },
  afternoon: {
    default: '활기차게 보내기 좋은 오후예요',
    맑음: '구름 한 점 없이 맑고 화창한 오후예요',
    '구름 많음': '구름이 많아 하늘이 포근하게 흐려요',
    흐림: '하늘 전체가 흐려 차분한 분위기예요',
    비: '비가 내리고 있어요, 우산을 챙기세요',
    뇌우: '천둥 번개를 동반한 비가 내려요',
  },
  sunset: {
    default: '하루를 마무리하는 노을이 아름다운 시간이에요',
    맑음: '붉은 노을이 번지는 낭만적인 하늘이에요',
    흐림: '노을 대신 잔잔하게 흐린 저녁이에요',
    비: '노을 없이 비가 내리는 차분한 저녁이에요',
  },
  night: {
    default: '차분하게 하루를 마무리하는 밤이에요',
    맑음: '별이 잘 보일 만큼 맑은 밤하늘이에요',
    비: '빗소리를 들으며 잠들기 좋은 밤이에요',
    눈: '조용히 눈이 내려앉는 밤이에요',
    안개: '가로등 불빛 사이로 안개가 낀 밤이에요',
  },
}

// 원래 문구 끝에 붙던 이모지(☕/🌧️) 자리를 대신하는 작은 svg 아이콘.
// weatherTheme.js/icons.js에 이미 검증된 svg를 재사용함
const MOOD_ICONS = {
  dawn: { default: ICONS.cupHot, 비: getWeatherTheme('비').icon },
  morning: { 비: getWeatherTheme('비').icon },
  night: { 비: getWeatherTheme('비').icon },
}

// 문구와 아이콘이 항상 같은 규칙(정확히 일치 → 없으면 default)으로 짝지어지도록 키 계산을 공유함
function resolveMoodKey(timeOfDay, status) {
  const table = MOOD_LINES[timeOfDay] ?? MOOD_LINES.afternoon
  const resolvedTimeOfDay = MOOD_LINES[timeOfDay] ? timeOfDay : 'afternoon'
  const key = table[status] !== undefined ? status : 'default'
  return { table, resolvedTimeOfDay, key }
}

export function getMoodLine(timeOfDay, status) {
  const { table, key } = resolveMoodKey(timeOfDay, status)
  return table[key]
}

export function getMoodIcon(timeOfDay, status) {
  const { resolvedTimeOfDay, key } = resolveMoodKey(timeOfDay, status)
  return MOOD_ICONS[resolvedTimeOfDay]?.[key] ?? null
}
