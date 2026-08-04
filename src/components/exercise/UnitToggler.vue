<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/configStore'

const configStore = useConfigStore()

const isFahrenheit = computed(() => configStore.unit === 'fahrenheit')
</script>

<template>
  <div class="unit-toggler">
    <button
      type="button"
      class="unit-switch"
      role="switch"
      :aria-checked="isFahrenheit"
      @click="configStore.toggleUnit"
    >
      <span class="unit-switch__thumb" :class="{ 'is-right': isFahrenheit }"></span>
      <span class="unit-switch__option" :class="{ active: !isFahrenheit }">°C</span>
      <span class="unit-switch__option" :class="{ active: isFahrenheit }">°F</span>
    </button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.unit-switch {
  position: relative;
  display: inline-flex;
  width: 76px;
  height: 30px;
  padding: 3px;
  border: none;
  border-radius: 999px;
  background: #e3e6ea;
  cursor: pointer;
}

.unit-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 999px;
  background: #2b3a55;
  transition: transform 0.2s ease;
}

.unit-switch__thumb.is-right {
  transform: translateX(100%);
}

.unit-switch__option {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  transition: color 0.2s ease;
}

.unit-switch__option.active {
  color: #fff;
}
</style>
