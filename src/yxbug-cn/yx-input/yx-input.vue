<template>
  <view
    class="u-search"
    :style="{
      margin,
    }"
    @tap="clickHandler"
  >
    <view
      class="u-content"
      :style="{
        backgroundColor: bgColor,
        borderRadius: shape === 'round' ? '100rpx' : '10rpx',
        border: borderStyle,
        height: `${height}rpx`,
      }"
    >
      <view class="u-icon-wrap">
        <slot name="icon"></slot>
      </view>
      <input
        placeholder-class="u-placeholder-class"
        class="u-input"
        type="text"
        :style="[
          {
            textAlign: inputAlign,
            color,
            backgroundColor: bgColor,
          },
          inputStyle,
        ]"
        :value="inputValue"
        :disabled="disabled"
        :focus="focus"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :placeholder-style="`color: ${placeholderColor}`"
        @blur="blur"
        @confirm="search"
        @focus="getFocus"
        @input="inputChange"
      />
      <view v-if="showClearIcon" class="u-close-wrap" @tap.stop="clear">
        <u-icon class="u-clear-icon" name="close-circle-fill" size="34" color="#c0c4cc"></u-icon>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

/**
 * 统一输入组件：负责承接 v-model、清空、禁用点击和基础样式。
 * 保持对现有调用方的 props / emits 兼容，避免页面层连锁改动。
 */
const emits = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'search',
  'custom',
  'clear',
  'focus',
  'blur',
  'click',
]);
const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
  },
  shape: {
    type: String,
    default: 'square',
  },
  bgColor: {
    type: String,
    default: '#f2f2f2',
  },
  placeholder: {
    type: String,
    default: '请输入关键字',
  },
  clearabled: {
    type: Boolean,
    default: false,
  },
  focus: {
    type: Boolean,
    default: false,
  },
  showAction: {
    type: Boolean,
    default: true,
  },
  actionStyle: {
    type: Object,
    default() {
      return {};
    },
  },
  actionText: {
    type: String,
    default: '搜索',
  },
  inputAlign: {
    type: String,
    default: 'left',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  animation: {
    type: Boolean,
    default: false,
  },
  border: {
    type: Boolean,
    default: false,
  },
  borderColor: {
    type: String,
    default: 'none',
  },
  height: {
    type: [Number, String],
    default: 64,
  },
  inputStyle: {
    type: Object,
    default() {
      return {};
    },
  },
  maxlength: {
    type: [Number, String],
    default: '-1',
  },
  searchIconColor: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#606266',
  },
  placeholderColor: {
    type: String,
    default: '#909399',
  },
  margin: {
    type: String,
    default: '0',
  },
  searchIcon: {
    type: String,
    default: 'search',
  },
});

const focused = ref(props.focus);
const innerValue = ref('');

const syncInputValue = ([modelValue, value]) => {
  const nextValue = modelValue || value || '';
  if (nextValue !== innerValue.value) {
    innerValue.value = nextValue;
  }
};

watch(() => [props.modelValue, props.value], syncInputValue, {
  immediate: true,
});

watch(
  () => props.focus,
  (value) => {
    focused.value = value;
  }
);

const inputValue = computed(() => innerValue.value);

const borderStyle = computed(() => {
  if (props.borderColor && props.borderColor !== 'none') {
    return `1px solid ${props.borderColor}`;
  }

  return props.border ? '1px solid #dcdfe6' : 'none';
});

const showClearIcon = computed(() => {
  return Boolean(innerValue.value && props.clearabled && focused.value && !props.disabled);
});

const emitValueChange = (value) => {
  innerValue.value = value;
  emits('input', value);
  emits('update:modelValue', value);
  emits('change', value);
};

function inputChange(event) {
  emitValueChange(event.detail.value);
}

function clear() {
  emitValueChange('');
  nextTick(() => {
    emits('clear');
  });
}

function search(event) {
  emits('search', event.detail.value);
  try {
    uni.hideKeyboard();
  } catch (error) {
    // 非 H5 平台下隐藏键盘失败时无需阻断输入流程。
  }
}

function getFocus() {
  focused.value = true;
  emits('focus', innerValue.value);
}

function blur() {
  setTimeout(() => {
    focused.value = false;
  }, 100);
  emits('blur', innerValue.value);
}

function clickHandler() {
  if (props.disabled) {
    emits('click');
  }
}
</script>

<style lang="scss" scoped>
@import 'vk-uview-ui/libs/css/style.components.scss';

.u-search {
  @include vue-flex;
  align-items: center;
  flex: 1;
}

.u-content {
  @include vue-flex;
  align-items: center;
  padding: 0 18rpx;
  flex: 1;
}

.u-clear-icon {
  @include vue-flex;
  align-items: center;
}

.u-input {
  flex: 1;
  font-size: 28rpx;
  line-height: 1;
  margin: 0 10rpx;
  color: $u-tips-color;
}

.u-close-wrap {
  width: 40rpx;
  height: 100%;
  @include vue-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.u-placeholder-class {
  color: $u-tips-color;
}
</style>
