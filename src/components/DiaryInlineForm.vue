<script setup>
import { ref } from 'vue'

const emit = defineEmits(['save', 'cancel'])

const title = ref('')
const content = ref('')

const save = () => {
  if (!title.value.trim() && !content.value.trim()) return
  emit('save', { title: title.value, content: content.value })
}
</script>

<template>
  <div class="inline-form">
    <p class="inline-form__label">[일기]</p>
    <input v-model="title" class="inline-form__title" placeholder="제목" />
    <textarea
      v-model="content"
      class="inline-form__content"
      placeholder="오늘 하루는 어땠나요?"
      rows="4"
    ></textarea>
    <div class="inline-form__actions">
      <button type="button" class="inline-form__cancel" @click="emit('cancel')">취소</button>
      <button type="button" class="inline-form__save" @click="save">저장</button>
    </div>
  </div>
</template>

<style scoped>
.inline-form {
  position: relative;
  width: 100%;
  margin: 0 0 20px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(20, 20, 30, 0.06);
}

/* 우측 하단 + 버튼을 가리키는 말풍선 꼬리 */
.inline-form::after {
  content: '';
  position: absolute;
  right: 26px;
  bottom: -14px;
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 16px solid rgba(255, 255, 255, 0.85);
  filter: drop-shadow(0 4px 3px rgba(20, 20, 30, 0.05));
}

.inline-form__label {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #3d84e5;
}

.inline-form__title {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: none;
  border-radius: 10px;
  background: #fff;
  font-size: 0.95rem;
  font-weight: 600;
}

.inline-form__title:focus,
.inline-form__content:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(61, 132, 229, 0.18);
}

.inline-form__content {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  resize: none;
}

.inline-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.inline-form__cancel,
.inline-form__save {
  padding: 8px 18px;
  border: none;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.inline-form__cancel {
  background: #f4f5f7;
  color: #666;
}

.inline-form__cancel:hover {
  background: #e9ebee;
}

.inline-form__save {
  background: #3d84e5;
  color: #fff;
}

.inline-form__save:hover {
  background: #2f6bc4;
}
</style>
