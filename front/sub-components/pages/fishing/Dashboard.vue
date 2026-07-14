<script setup>
import { fisherService } from '~/_services';

const usercatches = ref([])
const ready = ref(false)

onBeforeMount(async () => {
  usercatches.value = await fisherService.getUserLastCatches();
  ready.value = true
});
</script>

<template>
  <div class="container">
    <h1 class="title">Dashboard</h1>
    <template v-if="ready">
      A venir
    </template>
  </div>
</template>

<style scoped lang="scss">
.container {
  padding: 20px;
  background: transparent;
  min-height: 100vh;
}

.title {
  width: fit-content;
  margin: auto;
  font-size: 36px;
  font-weight: 800;
  color: white;
  margin-bottom: 40px;
  letter-spacing: 1px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
</style>
