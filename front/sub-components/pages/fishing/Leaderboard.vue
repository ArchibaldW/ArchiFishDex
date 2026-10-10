<script setup>
import { fisherService } from '~/_services';

const emit = defineEmits(['open-profile']);

const leaderboards = ref({});
const ready = ref(false);

onBeforeMount(async () => {
  leaderboards.value = await fisherService.getLeaderboards();
  ready.value = true
});

const getMedalClass = (rank) => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return '';
};

const leaderboardsData = [
  { key: 'totalCatches', title: 'Total de Captures', valueLabel: 'Catchs' },
  { key: 'uniqueCatches', title: 'Captures Uniques', valueLabel: 'Uniques' },
  { key: 'achievements', title: 'Succès Réussis', valueLabel: 'Succès' },
  { key: 'achievementPoints', title: 'Points de Succès Totaux', valueLabel: 'Points' }
];
</script>

<template>
  <div class="container">
    <h1 class="container__title">Le Kikimeter</h1>
    
    <div v-if="ready" class="leaderboards-grid">
      <div v-for="board in leaderboardsData" :key="board.key" class="leaderboard-card">
        <h2 class="leaderboard-card__title">{{ board.title }}</h2>
        
        <div class="leaderboard-card__content">
          <div 
            v-for="entry in leaderboards[board.key]" 
            :key="entry.rank"
            :class="['leaderboard-entry', getMedalClass(entry.rank)]"
          >
            <div class="leaderboard-entry__rank">
              <span v-if="entry.rank === 1">🥇</span>
              <span v-else-if="entry.rank === 2">🥈</span>
              <span v-else-if="entry.rank === 3">🥉</span>
              <span v-else>{{ entry.rank }}</span>
            </div>
            
            <button
              class="leaderboard-entry__name"
              type="button"
              @click="emit('open-profile', entry.username)"
            >
              {{ entry.displayName || entry.username }}
            </button>
            
            <div class="leaderboard-entry__value">
              {{ 
                board.key === 'totalCatches' ? entry.total :
                board.key === 'uniqueCatches' ? entry.unique :
                board.key === 'achievements' ? entry.count :
                entry.points
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  padding: 20px;
  background: transparent;
  min-height: 100vh;

  &__title {
    width: fit-content;
    margin: auto;
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 40px;
    color: white;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
}

.leaderboards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.leaderboard-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &__title {
    color: white;
    padding: 16px 20px;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  }

  &__content {
    padding: 0;
  }
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-left: 4px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  &__rank {
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    min-width: 30px;
  }

  &__name {
    padding: 0;
    border: 0;
    color: white;
    background: transparent;
    font-family: inherit;
    font-weight: 600;
    flex-grow: 1;
    text-align: left;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;

    &:hover {
      color: #ffcf5c;
      text-decoration: underline;
    }
  }

  &__value {
    text-align: right;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    min-width: 50px;
    font-size: 14px;
  }

  &.gold {
    border-left-color: $gold;
    background: rgba($gold, 0.30);

    .leaderboard-entry__rank {
      color: $gold;
    }

    .leaderboard-entry__value {
      color: $gold;
    }
  }

  &.silver {
    border-left-color: $silver;
    background: rgba($silver, 0.30);

    .leaderboard-entry__rank {
      color: $silver;
    }

    .leaderboard-entry__value {
      color: $silver;
    }
  }

  &.bronze {
    border-left-color: $bronze;
    background: rgba($bronze, 0.30);

    .leaderboard-entry__rank {
      color: $bronze;
    }

    .leaderboard-entry__value {
      color: $bronze;
    }
  }
}
</style>
