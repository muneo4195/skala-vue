import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

// OpenWeatherMap은 한글 도시명 조회가 불안정해서 영문 쿼리로 매핑
// region: 홈 화면에서 지역별로 그룹핑해서 보여주기 위한 구분
const CITY_QUERIES = [
  { id: 'city_01', name: '서울', query: 'Seoul,KR', region: '수도권' },
  { id: 'city_02', name: '부산', query: 'Busan,KR', region: '경상권' },
  { id: 'city_03', name: '대구', query: 'Daegu,KR', region: '경상권' },
  { id: 'city_04', name: '인천', query: 'Incheon,KR', region: '수도권' },
  { id: 'city_05', name: '광주', query: 'Gwangju,KR', region: '전라권' },
  { id: 'city_06', name: '대전', query: 'Daejeon,KR', region: '충청권' },
  { id: 'city_07', name: '울산', query: 'Ulsan,KR', region: '경상권' },
  { id: 'city_08', name: '세종', query: 'Sejong,KR', region: '충청권' },
  { id: 'city_09', name: '수원', query: 'Suwon,KR', region: '수도권' },
  { id: 'city_10', name: '성남', query: 'Seongnam,KR', region: '수도권' },
  { id: 'city_11', name: '고양', query: 'Goyang,KR', region: '수도권' },
  { id: 'city_12', name: '용인', query: 'Yongin,KR', region: '수도권' },
  { id: 'city_13', name: '부천', query: 'Bucheon,KR', region: '수도권' },
  { id: 'city_14', name: '안산', query: 'Ansan,KR', region: '수도권' },
  { id: 'city_15', name: '안양', query: 'Anyang,KR', region: '수도권' },
  { id: 'city_16', name: '남양주', query: 'Namyangju,KR', region: '수도권' },
  { id: 'city_17', name: '화성', query: 'Hwaseong,KR', region: '수도권' },
  { id: 'city_18', name: '평택', query: 'Pyeongtaek,KR', region: '수도권' },
  { id: 'city_19', name: '청주', query: 'Cheongju,KR', region: '충청권' },
  { id: 'city_20', name: '천안', query: 'Cheonan,KR', region: '충청권' },
  { id: 'city_21', name: '전주', query: 'Jeonju,KR', region: '전라권' },
  { id: 'city_22', name: '포항', query: 'Pohang,KR', region: '경상권' },
  { id: 'city_23', name: '창원', query: 'Changwon,KR', region: '경상권' },
  { id: 'city_24', name: '김해', query: 'Gimhae,KR', region: '경상권' },
  { id: 'city_25', name: '제주', query: 'Jeju,KR', region: '제주권' },
  { id: 'city_26', name: '춘천', query: 'Chuncheon,KR', region: '강원권' },
  { id: 'city_27', name: '원주', query: 'Wonju,KR', region: '강원권' },
  { id: 'city_28', name: '목포', query: 'Mokpo,KR', region: '전라권' },
  { id: 'city_29', name: '여수', query: 'Yeosu,KR', region: '전라권' },
  { id: 'city_30', name: '구미', query: 'Gumi,KR', region: '경상권' },
  { id: 'city_35', name: '파주', query: 'Paju,KR', region: '수도권' },
  { id: 'city_36', name: '하남', query: 'Hanam,KR', region: '수도권' },
  { id: 'city_37', name: '강릉', query: 'Gangneung,KR', region: '강원권' },
  { id: 'city_38', name: '속초', query: 'Sokcho,KR', region: '강원권' },
  { id: 'city_40', name: '충주', query: 'Chungju,KR', region: '충청권' },
  { id: 'city_41', name: '아산', query: 'Asan,KR', region: '충청권' },
  { id: 'city_42', name: '서산', query: 'Seosan,KR', region: '충청권' },
  { id: 'city_43', name: '공주', query: 'Gongju,KR', region: '충청권' },
  { id: 'city_44', name: '경주', query: 'Gyeongju,KR', region: '경상권' },
  { id: 'city_45', name: '진주', query: 'Jinju,KR', region: '경상권' },
  { id: 'city_46', name: '안동', query: 'Andong,KR', region: '경상권' },
  { id: 'city_49', name: '김천', query: 'Gimcheon,KR', region: '경상권' },
  { id: 'city_50', name: '순천', query: 'Suncheon,KR', region: '전라권' },
  { id: 'city_51', name: '익산', query: 'Iksan,KR', region: '전라권' },
  { id: 'city_52', name: '군산', query: 'Gunsan,KR', region: '전라권' },
  { id: 'city_53', name: '나주', query: 'Naju,KR', region: '전라권' },
]

export const REGION_ORDER = ['수도권', '강원권', '충청권', '경상권', '전라권', '제주권']

// OpenWeatherMap의 어색한 한글 자동번역 대신, 날씨 코드(id) 기준으로 직접 쉬운 라벨을 붙임
// https://openweathermap.org/weather-conditions
function getWeatherLabel(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return '뇌우'
  if (weatherId >= 300 && weatherId < 400) return '이슬비'
  if (weatherId >= 500 && weatherId < 600) return '비'
  if (weatherId >= 600 && weatherId < 700) return '눈'
  if (weatherId >= 700 && weatherId < 800) return '안개'
  if (weatherId === 800) return '맑음'
  if (weatherId === 801 || weatherId === 802) return '구름 조금'
  if (weatherId === 803) return '구름 많음'
  if (weatherId === 804) return '흐림'
  return '알 수 없음'
}

export const useWeatherStore = defineStore('weather', () => {
  const cities = ref([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

  async function fetchCityWeather(city) {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city.query,
        appid: API_KEY,
        units: 'metric',
        lang: 'kr',
      },
    })
    return {
      id: city.id,
      name: city.name,
      region: city.region,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      status: getWeatherLabel(data.weather[0].id),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    }
  }

  async function loadCities() {
    // 이미 도시 목록 전체를 불러왔으면 재요청하지 않음(홈↔상세 이동 시 재조회 방지)
    // CITY_QUERIES가 늘어난 뒤에도 이전 캐시 개수와 다르면 다시 불러오도록 개수까지 비교
    if (cities.value.length === CITY_QUERIES.length) return

    isLoading.value = true
    errorMessage.value = ''
    const results = await Promise.allSettled(CITY_QUERIES.map(fetchCityWeather))

    cities.value = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)

    const failedCount = results.length - cities.value.length
    if (failedCount > 0) {
      console.error(`${failedCount}개 도시 날씨 조회 실패`)
    }
    if (cities.value.length === 0) {
      errorMessage.value = '날씨 정보를 불러오지 못했습니다. API 키를 확인해주세요.'
    }

    isLoading.value = false
  }

  function getCityById(id) {
    return cities.value.find((city) => city.id === id) ?? null
  }

  return { cities, isLoading, errorMessage, loadCities, getCityById }
})
