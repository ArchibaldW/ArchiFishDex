<script setup>
import { fisherService } from '~/_services';

const emit = defineEmits(['open-profile']);

const catchSummary = ref({ dernieres: [], meilleures: {} });
const pokemonCatalog = ref([]);
const ready = ref(false);

onBeforeMount(async () => {
  const [summary, catalog] = await Promise.all([
    fisherService.getUserLastCatches(),
    fisherService.getUserPokedex()
  ]);

  catchSummary.value = summary || { dernieres: [], meilleures: {} };
  pokemonCatalog.value = catalog || [];
  ready.value = true;
});

const pokemonByCode = computed(() => new Map(
  pokemonCatalog.value.map(pokemon => [pokemon.code, pokemon])
));

const bestCatchPeriods = computed(() => {
  const best = catchSummary.value.meilleures || {};
  return [
    { key: 'jour', period: 'Aujourd’hui', catches: best.jour },
    { key: 'semaine', period: 'Cette semaine', catches: best.semaine },
    { key: 'mois', period: 'Ce mois-ci', catches: best.mois }
  ];
});

function getPokemonName(catchItem) {
  return pokemonByCode.value.get(catchItem.code)?.name || `#${catchItem.code}`;
}

function getSprite(catchItem) {
  return `/assets/${catchItem.code}${catchItem.shiny ? 's' : ''}.png`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));
}

</script>

<template>
  <div class="dashboard">
    <h1 class="dashboard__title">Tableau de bord</h1>

    <template v-if="ready">
      <div class="dashboard__columns">
        <section class="dashboard__section dashboard__section--recent">
          <h2 class="dashboard__subtitle">Les 10 dernières captures</h2>
          <div v-if="catchSummary.dernieres?.length" class="dashboard__catches">
            <article
              v-for="(catchItem, index) in catchSummary.dernieres"
              :key="`${catchItem._id || catchItem.code}-${catchItem.date}-${index}`"
              class="catch-card"
            >
              <img
                class="catch-card__sprite"
                :src="getSprite(catchItem)"
                :alt="getPokemonName(catchItem)"
                loading="lazy"
              >
              <div class="catch-card__info">
                <h3 class="catch-card__name">
                  {{ getPokemonName(catchItem) }}
                  <span v-if="catchItem.shiny" class="catch-card__shiny" aria-label="Shiny">✨</span>
                </h3>
                <p class="catch-card__stats">
                  {{ formatNumber(catchItem.weight) }} kg
                  <span aria-hidden="true">·</span>
                  {{ formatNumber(catchItem.value) }} or
                </p>
                <p class="catch-card__meta">
                  <button
                    class="catch-card__profile-link"
                    type="button"
                    @click="emit('open-profile', catchItem.username)"
                  >
                    {{ catchItem.displayName || catchItem.username }}
                  </button>
                  · {{ formatDate(catchItem.date) }}
                </p>
              </div>
            </article>
          </div>
          <p v-else class="dashboard__empty">Aucune capture pour le moment.</p>
        </section>

        <section class="dashboard__section dashboard__section--best">
          <h2 class="dashboard__subtitle">Meilleures captures</h2>
          <div class="dashboard__periods">
            <article
              v-for="period in bestCatchPeriods"
              :key="period.key"
              class="period-card"
            >
              <h3 class="period-card__title">{{ period.period }}</h3>
              <div class="period-card__records">
                <div
                  v-for="metric in ['weight', 'value']"
                  :key="metric"
                  class="best-record"
                  :class="`best-record--${metric}`"
                >
                  <template v-if="period.catches?.[metric]">
                    <img
                      class="best-record__sprite"
                      :src="getSprite(period.catches[metric])"
                      :alt="getPokemonName(period.catches[metric])"
                      loading="lazy"
                    >
                    <div class="best-record__info">
                      <p class="best-record__label">
                        {{ metric === 'weight' ? 'Meilleur poids' : 'Meilleure valeur' }}
                      </p>
                      <p class="best-record__pokemon">
                        {{ getPokemonName(period.catches[metric]) }}
                        <span v-if="period.catches[metric].shiny" aria-label="Shiny">✨</span>
                      </p>
                      <p class="best-record__value">
                        {{ formatNumber(period.catches[metric][metric]) }}
                        <span v-if="metric === 'weight'" class="best-record__unit">kg</span>
                        <span v-else class="best-record__unit" aria-label="pièces d’or">or</span>
                      </p>
                      <button
                        class="best-record__profile-link"
                        type="button"
                        @click="emit('open-profile', period.catches[metric].username)"
                      >
                        {{ period.catches[metric].displayName || period.catches[metric].username }}
                      </button>
                    </div>
                  </template>
                  <p v-else class="best-record__empty">
                    Pas encore de record de {{ metric === 'weight' ? 'poids' : 'valeur' }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  box-sizing: border-box;
  min-height: calc(100vh - 100px);
  padding: 8px 16px 12px;
  color: white;

  &__title {
    width: fit-content;
    margin: 0 auto 10px;
    padding-bottom: 4px;
    border-bottom: 2px solid #ffcf5c;
    font-size: clamp(22px, 2.5vw, 28px);
    font-weight: 800;
    letter-spacing: 1px;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &__columns {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    align-items: start;
    gap: 12px;
    max-width: 1600px;
    margin: 0 auto;
  }

  &__section {
    min-width: 0;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    background: rgba(12, 20, 42, 0.55);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
  }

  &__subtitle {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    font-size: clamp(17px, 1.8vw, 20px);
    font-weight: 700;

    &::before {
      width: 4px;
      height: 18px;
      border-radius: 5px;
      background: #ffcf5c;
      content: '';
    }
  }

  &__catches {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  &__periods {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  &__empty {
    padding: 14px;
    color: rgba(255, 255, 255, 0.75);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    text-align: center;
  }
}

.catch-card,
.period-card {
  overflow: hidden;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(44, 61, 99, 0.78), rgba(27, 35, 67, 0.88));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 207, 92, 0.55);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
  }
}

.catch-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 6px 9px;

  &__sprite {
    width: 46px;
    height: 46px;
    padding: 2px;
    border-radius: 50%;
    object-fit: contain;
    flex: 0 0 auto;
    background: rgba(255, 255, 255, 0.1);
  }

  &__info {
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
  }

  &__shiny {
    color: #ffd54f;
  }

  &__stats,
  &__meta {
    margin-top: 3px;
    font-size: 11px;
    line-height: 1.3;
  }

  &__meta {
    color: rgba(255, 255, 255, 0.7);
    overflow-wrap: anywhere;
  }

  &__profile-link {
    padding: 0;
    border: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: #ffcf5c;
      text-decoration: underline;
    }
  }
}

.period-card {
  padding: 9px 12px;

  &__title {
    margin-bottom: 7px;
    color: #ffe29a;
    font-size: 14px;
    font-weight: 700;
  }

  &__records {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
}

.best-record {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  min-height: 76px;
  padding: 8px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.045);

  &__sprite {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 50%;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.09);
  }

  &__info {
    min-width: 0;
    flex: 1;
  }

  &__label {
    color: rgba(255, 255, 255, 0.72);
    font-size: 11px;
  }

  &__pokemon {
    overflow: hidden;
    margin-top: 2px;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value {
    margin-top: 2px;
    color: #ffcf5c;
    font-size: 16px;
    font-weight: 800;
  }

  &__unit {
    font-size: 12px;
    font-weight: 700;
  }

  &__profile-link {
    max-width: 100%;
    overflow: hidden;
    margin-top: 2px;
    padding: 0;
    border: 0;
    color: rgba(255, 255, 255, 0.7);
    background: transparent;
    font: inherit;
    font-size: 11px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;

    &:hover {
      color: #ffcf5c;
      text-decoration: underline;
    }
  }

  &__empty {
    align-self: center;
    padding: 4px 1px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 11px;
    line-height: 1.35;
  }

}

@media (max-width: 900px) {
  .dashboard {
    padding: 8px;

    &__columns {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 8px;
    }

    &__section {
      padding: 9px;
    }

    &__catches {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 650px) {
  .dashboard__columns {
    grid-template-columns: 1fr;
  }

  .dashboard__catches {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .dashboard__catches {
    grid-template-columns: 1fr;
  }
}
</style>
