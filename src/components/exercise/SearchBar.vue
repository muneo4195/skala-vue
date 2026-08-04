<script setup>
defineProps({
  searchQuery: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update-query'])

const onInput = (event) => {
  emit('update-query', event.target.value)
}
</script>

<template>
  <div class="search-bar">
    <input
      type="text"
      class="search-input"
      placeholder="검색할 도시 이름 입력"
      :value="searchQuery"
      @input="onInput"
    />
    <p class="search-echo">검색 중인 도시: {{ searchQuery }}</p>
  </div>
</template>

<style scoped>
.search-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 1rem;
  border: none;
  border-radius: 10px;
  background: #f4f5f7;
  transition: box-shadow 0.15s ease;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(61, 132, 229, 0.18);
}

.search-echo {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: #666;
}
</style>
