<script setup>
import { ElRate } from 'element-plus'

// 부모(WeatherHomeView)가 들고 있는 draft 객체를 v-model로 물려받아 직접
// 수정함. 팝업을 X로 닫아도 이 컴포넌트만 사라질 뿐 draft는 부모에 남아있으므로,
// 다시 열면 쓰던 내용이 그대로 보임
const draft = defineModel('draft', { type: Object, required: true })

const emit = defineEmits(['save'])

// 제목은 필수, 내용은 없어도 저장 가능
const save = () => {
  if (!draft.value.title.trim()) return
  emit('save', { title: draft.value.title, content: draft.value.content, rating: draft.value.rating })
}

// "취소"는 팝업을 닫는 게 아니라 쓰던 내용만 전부 지우는 초기화 버튼(팝업을
// 닫는 건 이제 +버튼이 바뀐 X뿐)
const resetDraft = () => {
  draft.value.title = ''
  draft.value.content = ''
  draft.value.rating = 0
}
</script>

<template>
  <div class="inline-form">
    <p class="inline-form__label">[일기]</p>
    <input v-model="draft.title" class="inline-form__title" placeholder="제목 (필수)" required />
    <textarea
      v-model="draft.content"
      class="inline-form__content"
      placeholder="오늘 하루는 어땠나요?"
      rows="4"
    ></textarea>
    <div class="inline-form__rating">
      <span class="inline-form__rating-label">오늘 하루는?</span>
      <el-rate v-model="draft.rating" allow-half />
    </div>
    <div class="inline-form__actions">
      <button type="button" class="inline-form__cancel" @click="resetDraft">초기화</button>
      <button type="button" class="inline-form__save" @click="save">저장</button>
    </div>
  </div>
</template>

<style scoped>
.inline-form {
  position: relative;
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(20, 20, 30, 0.25);
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

.inline-form__rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.inline-form__rating-label {
  font-size: 0.85rem;
  color: #666;
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
