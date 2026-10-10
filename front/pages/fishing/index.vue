<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '~/store';
import Dashboard from '~/sub-components/pages/fishing/Dashboard.vue';
import Pokedex from '~/sub-components/pages/fishing/Pokedex.vue';
import Statistics from '~/sub-components/pages/fishing/Statistics.vue';
import Achievements from '~/sub-components/pages/fishing/Achievements.vue';
import Leaderboard from '~/sub-components/pages/fishing/Leaderboard.vue';
import Profile from '~/sub-components/pages/fishing/Profile.vue';

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const router = useRouter()
const route = useRoute()

const allowedTabs = ['dashboard', 'pokedex', 'statistics', 'achievements', 'leaderboard']
const initialTab = typeof route.query.tab === 'string' && allowedTabs.includes(route.query.tab)
  ? route.query.tab
  : 'dashboard'
const selectedTab = ref(initialTab)
const initialPokedexUsername = ref(typeof route.query.user === 'string' ? route.query.user : '')
const selectedProfileUsername = ref('');
const profileReturnTab = ref(initialTab)
const tabList = [
    {label : 'Tableau de bord', value : 'dashboard'},
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

function openProfile(username) {
  if (!selectedProfileUsername.value && selectedTab.value) {
    profileReturnTab.value = selectedTab.value;
  }
  selectedProfileUsername.value = username;
  selectedTab.value = null;
}

function openUserPokedex(username) {
  selectedProfileUsername.value = '';
  initialPokedexUsername.value = username === user.value?.username ? '' : username;
  selectedTab.value = 'pokedex';
}

watch(selectedTab, tab => {
  if (tab) selectedProfileUsername.value = '';
});
</script>

<template>
    <div class="fishing-container">
        <div class="fishing-container__navigation">
          <v-tabs v-model="selectedTab" class="fishing-container__tabs">
              <v-tab v-for="tab in tabList" :key="tab.value" :value="tab.value">{{ tab.label }}</v-tab>
          </v-tabs>
          <v-btn
            v-if="user?.username"
            class="fishing-container__profile-button"
            variant="text"
            prepend-icon="mdi-account-circle"
            @click="openProfile(user.username)"
          >
            Mon profil
          </v-btn>
        </div>
        <div class="fishing-container__content">
          <Profile
            v-if="selectedProfileUsername"
            :username="selectedProfileUsername"
            :is-own-user="selectedProfileUsername === user?.username"
            @view-pokedex="openUserPokedex"
          />
          <Dashboard v-else-if="selectedTab === 'dashboard'" @open-profile="openProfile"/>
          <Pokedex v-else-if="selectedTab === 'pokedex'" :initial-username="initialPokedexUsername"/>
          <Statistics v-else-if="selectedTab === 'statistics'"/>
          <Achievements v-else-if="selectedTab === 'achievements'"/>
          <Leaderboard v-else-if="selectedTab === 'leaderboard'" @open-profile="openProfile"/>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.fishing-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;

  &__tabs {
    background: transparent;
    flex: 1;
    min-width: 0;


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

  &__navigation {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  &__profile-button {
    flex: 0 0 auto;
    margin-right: 12px;
    color: white;
  }

  &__content {
    min-height: calc(100vh - 100px);
  }
}

@media (max-width: 600px) {
  .fishing-container {
    &__navigation {
      align-items: stretch;
      flex-direction: column-reverse;
    }

    &__profile-button {
      align-self: flex-end;
      margin-right: 8px;
    }
  }
}
</style>
