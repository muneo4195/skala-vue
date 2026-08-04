<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="bottom-nav__item">
      <svg class="bottom-nav__icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 6.982C9.664 5.309 13.825 8.236 8 12 2.175 8.236 6.336 5.309 8 6.982"/>
        <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.707L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.646a.5.5 0 0 0 .708-.707L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
      </svg>
      <span class="bottom-nav__label">홈</span>
    </RouterLink>

    <RouterLink to="/cities" class="bottom-nav__item">
      <svg class="bottom-nav__icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 640" aria-hidden="true"><path d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/>
      </svg>
      <span class="bottom-nav__label">전체보기</span>
    </RouterLink>

    <RouterLink to="/about" class="bottom-nav__item">
      <svg class="bottom-nav__icon" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
        <path
          d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z"
        />
      </svg>
      <span class="bottom-nav__label">소개</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  justify-content: space-around;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 -8px 24px rgba(20, 20, 30, 0.08);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 18px;
  border-radius: 10px;
  color: #98a2b3;
  text-decoration: none;
  font-size: 0.7rem;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.bottom-nav__icon {
  width: 1.2rem;
  height: 1.2rem;
  display: block;
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.bottom-nav__icon--emoji {
  width: auto;
  height: auto;
  font-size: 1.3rem;
  line-height: 1;
}

.bottom-nav__item:hover {
  color: #3d84e5;
}

.bottom-nav__item.router-link-exact-active {
  color: #3d84e5;
}

.bottom-nav__item.router-link-exact-active .bottom-nav__icon {
  transform: scale(1.2);
  filter: saturate(1.6) brightness(0.95);
}
</style>
