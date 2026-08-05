import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'weather-favorite-city'
const DEFAULT_CITY_ID = 'city_01' // 서울

// 히어로에 보여줄 대표 도시(즐겨찾기)를 새로고침해도 유지되도록 localStorage에 저장
// 리뷰: setFavorite은 상태만 바꾸고, 실제 저장은 아래 watch가 담당하는 구조임을 확인함
export const useFavoriteStore = defineStore('favorite', () => {
  const favoriteCityId = ref(localStorage.getItem(STORAGE_KEY) || DEFAULT_CITY_ID)

  function setFavorite(cityId) {
    favoriteCityId.value = cityId
  }

  watch(favoriteCityId, (id) => {
    localStorage.setItem(STORAGE_KEY, id)
  })

  return { favoriteCityId, setFavorite }
})
