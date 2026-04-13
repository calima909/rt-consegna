<template>
  <div class="spectrum">
    <h4>{{ playerName }}</h4>
    <div class="columns">
      <div 
        v-for="(height, x) in spectrum" 
        :key="x" 
        class="column"
      >
        <div 
          v-for="y in maxRows" 
          :key="y" 
          :class="{'filled': y <= height}"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  playerName: String,
  spectrum: {
    type: Array,
    default: () => Array(10).fill(0)
  },
  maxRows: {
    type: Number,
    default: 20
  }
})

</script>

<style scoped>
.spectrum {
  display: inline-block;
  margin: 0 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: #fff;
}

.columns {
  display: flex;
  gap: 2px;
  margin-top: 0.5rem;
}

.column {
  display: flex;
  flex-direction: column-reverse;
  gap: 1px;
}

.column div {
  width: 3px;
  height: 3px;
  background: #383838;
}

.column div.filled {
  background: #e74c3c;
}
</style>
