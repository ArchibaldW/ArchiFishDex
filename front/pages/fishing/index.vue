<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '~/store';
import Dashboard from '~/sub-components/pages/fishing/Dashboard.vue';
import Pokedex from '~/sub-components/pages/fishing/Pokedex.vue';
import Statistics from '~/sub-components/pages/fishing/Statistics.vue';
import Achievements from '~/sub-components/pages/fishing/Achievements.vue';
import Leaderboard from '~/sub-components/pages/fishing/Leaderboard.vue';

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const router = useRouter()

const selectedTab = ref('')
const tabList = [
    // {label : 'Tableau de bord', value : 'dashboard'},
    {label : 'Pokédex', value : 'pokedex'},
    {label : 'Statistiques', value : 'statistics'},
    {label : 'Succès', value : 'achievements'},
    {label : 'Kikimeter', value : 'leaderboard'}
]

onBeforeMount(async () => {
  if(!user.value){
    await router.push('/')
  }
});
</script>

<template>
    <div class="fishing-container">
        <v-tabs v-model="selectedTab" class="fishing-container__tabs">
            <v-tab v-for="tab in tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</v-tab>
        </v-tabs>
        <div class="fishing-container__content">
          <!-- <Dashboard v-if="selectedTab === 'dashboard'"/> -->
          <Pokedex v-if="selectedTab === 'pokedex'"/>
          <Statistics v-else-if="selectedTab === 'statistics'"/>
          <Achievements v-else-if="selectedTab === 'achievements'"/>
          <Leaderboard v-else-if="selectedTab === 'leaderboard'"/>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.fishing-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;

  &__tabs {
    background: transparent;
    margin-bottom: 20px;


      .v-tab {
        font-size: 13px;
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        &.v-tab--selected {
          background: rgba(255, 255, 255, 0.2);
        }
      }
  }

  &__content {
    min-height: calc(100vh - 100px);
  }
}
</style>

