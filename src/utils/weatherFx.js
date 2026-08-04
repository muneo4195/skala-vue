// 비 효과: 일정 간격으로 반복되는 패턴 대신, 길이·위치·속도가 제각각인
// 끊긴 빗줄기(짧은 선분)들을 불규칙하게 흩뿌려서 움직이도록 함.
// top을 %로 애니메이션해야 컨테이너 높이 기준으로 실제로 끝까지 떨어짐
// (transform: translateY(%)는 요소 자기 자신의 크기 기준이라 살짝만 움직임)
export function createRaindrops(count = 28) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.round(Math.random() * 100)}%`,
      height: `${(10 + Math.random() * 22).toFixed(0)}px`,
      opacity: (0.25 + Math.random() * 0.45).toFixed(2),
      animationDuration: `${(1.4 + Math.random() * 1.4).toFixed(2)}s`,
      animationDelay: `${(Math.random() * -3).toFixed(2)}s`,
    },
  }))
}

// 눈 효과용 눈송이 위치/속도를 살짝씩 다르게 흩뿌려서 자연스럽게 보이도록 함
export function createSnowflakes(count = 40) {
  return Array.from({ length: count }, (_, i) => {
    const size = (3 + Math.random() * 4).toFixed(1)
    return {
      id: i,
      style: {
        left: `${Math.round((i / count) * 100 + (Math.random() * 4 - 2))}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${(5 + Math.random() * 5).toFixed(2)}s`,
        animationDelay: `${(Math.random() * -8).toFixed(2)}s`,
      },
    }
  })
}
