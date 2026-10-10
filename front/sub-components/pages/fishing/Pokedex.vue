<script setup>
import { fisherService } from '~/_services';
import { Tag, Type } from '~/_helpers';
import { useUserStore } from '~/store';

const props = defineProps({
  initialUsername: { type: String, default: '' }
});

const pokedex = ref([])
const pokedexUsers = ref([])
const ready = ref(false)
const loadError = ref('');
const usersError = ref('');
const searchName = ref('');
const filterCaught = ref('all');
const sortBy = ref('id_asc')
const selectedGen = ref(null);
const selectedTag = ref(null);
const selectedTypes = ref([]);
const selectedPokedex = ref(props.initialUsername ? `user:${props.initialUsername}` : 'mine');
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const pokedexViewOptions = computed(() => [
  { title: 'Mon Pokédex', value: 'mine' },
  { title: 'Pokédex global', value: 'global' },
  ...pokedexUsers.value
    .filter(pokedexUser => pokedexUser.username !== user.value?.username)
    .map(pokedexUser => ({
      title: pokedexUser.displayName || pokedexUser.username,
      value: `user:${pokedexUser.username}`
    }))
]);

const pokedexTitle = computed(() => {
  if (selectedPokedex.value === 'global') return 'Pokédex global';
  if (selectedPokedex.value.startsWith('user:')) {
    const username = selectedPokedex.value.slice(5);
    const pokedexUser = pokedexUsers.value.find(user => user.username === username);
    return `Pokédex de ${pokedexUser?.displayName || username}`;
  }
  return 'Ton Pokédex';
});

async function loadPokedex() {
  ready.value = false;
  loadError.value = '';

  try {
    let result;

    if (selectedPokedex.value === 'global') {
      result = await fisherService.getUserPokedex({ global: true });
    } else if (selectedPokedex.value.startsWith('user:')) {
      result = await fisherService.getUserPokedex({
        username: selectedPokedex.value.slice(5)
      });
    } else {
      result = await fisherService.getUserPokedex();
    }

    if (!Array.isArray(result)) {
      throw new Error(result?.error || 'Impossible de charger ce Pokédex.');
    }

    pokedex.value = result;
  } catch (error) {
    pokedex.value = [];
    loadError.value = error instanceof Error ? error.message : 'Impossible de charger ce Pokédex.';
  } finally {
    ready.value = true;
  }
}

onBeforeMount(async () => {
  const users = await fisherService.getPokedexUsers();
  if (Array.isArray(users)) {
    pokedexUsers.value = users;
  } else {
    usersError.value = users?.error || 'Impossible de charger la liste des utilisateurs.';
  }
  await loadPokedex();
});

watch(selectedPokedex, loadPokedex);

function codeOnlyNumber(code){
  const match = code.match(/^(\d{4})/);
  return match ? match[1] : code;
}

const sortOptions = [
  { title: 'Numéro croissants', value: 'id_asc' },
  { title: 'Numéro décroissants', value: 'id_desc' },
  { title: 'Plus capturés', value: 'count_desc' }
]

const availableGens = computed(() => {
  const gens = new Set();
  pokedex.value.forEach(item => {
    if (item.gen) gens.add(item.gen);
  });
  return Array.from(gens).sort((a, b) => a - b); 
});

const availableTags = computed(() => {
  const tags = new Set();
  pokedex.value.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).map(tag => ({
    value: tag,
    label: Tag[tag] || tag
  })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
});

const availableTypes = computed(() => {
  const types = new Set();
  pokedex.value.forEach(item => {
    if (item.type1) types.add(item.type1);
    if (item.type2) types.add(item.type2);
  });
  return Array.from(types).map(type => ({
    value: type,
    label: Type[type] || type
  })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
});

const resetFilters = () => {
  selectedGen.value = null;
  selectedTag.value = null;
  selectedTypes.value = [];
  showShiny.value = false;
  filterCaught.value = 'all';
  searchName.value = '';
}

const processedPokedex = computed(() => {
  let result = pokedex.value.filter(catchItem => {
    const isCaught = showShiny.value ? catchItem.caughtShiny : catchItem.caughtNormal;

    if (filterCaught.value === 'caught' && !isCaught) {
      return false;
    }
    if (filterCaught.value === 'uncaught' && isCaught) {
      return false;
    }

    if (searchName.value) {
      const query = searchName.value.toLowerCase();
      const pokemonName = catchItem.name ? catchItem.name.toLowerCase() : '';
      if (!pokemonName.includes(query)) return false;
    }

    if (selectedGen.value) {
      if (catchItem.gen !== selectedGen.value) return false; 
    }

    if (selectedTag.value) {
      if (!catchItem.tags || !catchItem.tags.includes(selectedTag.value)) return false;
    }

    if (selectedTypes.value.length === 1) {
      const t1 = selectedTypes.value[0];
      return catchItem.type1 === t1 || catchItem.type2 === t1;
    } 
    else if (selectedTypes.value.length === 2) {
      const t1 = selectedTypes.value[0];
      const t2 = selectedTypes.value[1];
      return (catchItem.type1 === t1 && catchItem.type2 === t2) || (catchItem.type1 === t2 && catchItem.type2 === t1);
    }

    return true;
  });

  return result.sort((a, b) => {
    if (sortBy.value === 'id_asc') {
      return a.code.toString().localeCompare(b.code.toString());
    } 
    else if (sortBy.value === 'id_desc') {
      return b.code.toString().localeCompare(a.code.toString());
    } 
    else if (sortBy.value === 'count_desc') {
      const countA = showShiny.value ? (a.countShiny || 0) : (a.countNormal || 0);
      const countB = showShiny.value ? (b.countShiny || 0) : (b.countNormal || 0);
      
      if (countB === countA) {
        return a.code.toString().localeCompare(b.code.toString());
      }
      return countB - countA;
    }
  });
});

const showShiny = ref(false)
</script>

<template>
  <div class="container">
    <h1 class="title">{{ pokedexTitle }}</h1>
    <v-alert v-if="usersError" type="warning" class="pokedex-message">
      {{ usersError }}
    </v-alert>
    <v-alert v-if="loadError" type="error" class="pokedex-message">
      {{ loadError }}
    </v-alert>
    <template v-if="ready">
      <div class="filters">
        <v-select
          v-model="selectedPokedex"
          :items="pokedexViewOptions"
          item-title="title"
          item-value="value"
          label="Pokédex"
          variant="outlined"
          density="compact"
          hide-details
          class="pokedex-select"
        />

        <v-chip-group 
          v-model="showShiny" 
          mandatory 
          class="mr-4"
        >
          <v-chip :value="false" variant="outlined">
            Normaux
          </v-chip>
          
          <v-chip :value="true" variant="outlined">
            ✨ Shiny
          </v-chip>
        </v-chip-group>

        <v-chip-group v-model="filterCaught" mandatory class="mr-4">
          <v-chip value="all" variant="outlined">Tous</v-chip>
          <v-chip value="caught" variant="outlined">Capturés</v-chip>
          <v-chip value="uncaught" variant="outlined">Manquants</v-chip>
        </v-chip-group>

        <v-select
          v-model="sortBy"
          :items="sortOptions"
          item-title="title"
          item-value="value"
          label="Trier par"
          variant="outlined"
          density="compact"
          hide-details
          class="sort-select"
        />
        <v-text-field
          v-model="searchName"
          label="Chercher un nom..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="search-bar"
        />
      </div>

      <div class="chip-container">

        <div class="chip-filters" v-if="availableGens.length > 0">
          <div class="chip-filters__title">Générations</div>
          <v-chip-group v-model="selectedGen" column>
              <v-chip 
                v-for="gen in availableGens" 
                :key="gen"
                :value="gen"
                variant="outlined"
              >
                Genération {{ gen }}
              </v-chip>
          </v-chip-group>
        </div>

        <div class="chip-filters" v-if="availableTags.length > 0">
          <div class="chip-filters__title">Tags spéciaux</div>
          <v-chip-group v-model="selectedTag" column>
            <v-chip 
              v-for="tag in availableTags" 
              :key="tag"
              :value="tag.value"
              variant="outlined"
            >
              {{ tag.label }}
            </v-chip>
          </v-chip-group>
        </div>

        <div class="chip-filters" v-if="availableTypes.length > 0">
          <div class="chip-filters__title">Types (2 max)</div>
          <v-chip-group v-model="selectedTypes" column multiple :max="2">
            <v-chip 
              v-for="type in availableTypes" 
              :key="type"
              :value="type.value"
              variant="outlined"
              :class="`chip-filter--type-${type.value}`">
              {{ type.label }}
            </v-chip>
          </v-chip-group>
        </div>

        <v-btn class="filters-reset" variant="outlined" @click="resetFilters" v-if="selectedGen || selectedTag || selectedTypes.length > 0 || showShiny || filterCaught !== 'all' || searchName">
            Réinitialiser les filtres
        </v-btn>
      </div>

      <div class="pokecards">
        <v-card 
          v-for="catchItem in processedPokedex" 
          :key="catchItem.code"
          class="pokecards__pokecard"
          :class="[
            { 'pokemon-caught': !showShiny ? catchItem.caughtNormal : catchItem.caughtShiny },
            `type1-${catchItem.type1}`,
            catchItem.type2 ? `type2-${catchItem.type2}` : null
          ]"
          >
            <div v-if="showShiny ? catchItem.countShiny > 1 : catchItem.countNormal > 1" class="pokecards__pokecard__count">
              x {{ showShiny ? catchItem.countShiny : catchItem.countNormal }}
            </div>
            <v-card-title class="pokecards__pokecard__title">#{{codeOnlyNumber(catchItem.code)}} - {{ (showShiny ? catchItem.caughtShiny : catchItem.caughtNormal) ? catchItem.name : '???' }}</v-card-title>
            <div class="pokecards__pokecard__images">
              <img v-show="!showShiny" class="pokecards__pokecard__image" :src="`/assets/${catchItem.code}.png`" />
              <img v-show="showShiny" class="pokecards__pokecard__image" :src="`/assets/${catchItem.code}s.png`" />
            </div>
        </v-card>
      </div>
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

.pokedex-select {
  width: 190px;
  flex: 0 1 190px;
  color: white;
}

.pokedex-message {
  max-width: 900px;
  margin: 0 auto 20px;
}

.filters {
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.08);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);

  .sort-select {
    max-width: 200px;
    min-width: 150px;
    color: white;
  }

  .search-bar {
    min-width: 200px;
    max-width: 300px;
    flex-grow: 1;
    color: white;
  }
}

.filters-reset{
  margin: auto;
  color: red;
  border-radius: 25px;
  padding: 6px 20px;
  transition: all 0.3s ease;
}

.chip-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;

  .chip-filters {
    display: flex;
    flex-direction: column;
    align-items: center;

    &__title {
      font-size: 14px;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 15px;
    }
  }
}

:deep(.v-chip) {
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.05) !important;
  color: white !important;
  backdrop-filter: blur(10px) !important;
  transition: all 0.3s ease !important;
  font-weight: 600 !important;
}

:deep(.v-chip:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.v-chip--selected) {
  .v-chip__overlay {
    background: #2481EF
  }
  border-color: #2481EF !important;
}

@each $type, $color in $type-colors {
  :deep(.chip-filter--type-#{$type}) {
    &.v-chip--selected{
      .v-chip__overlay {
        background: $color !important;
      }
      border-color: $color !important;
    }
  }
}

.pokecards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 20px;

  @media (max-width: 768px){
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }

  &__pokecard{
    display: flex;
    align-items: center;
    flex-direction: column;
    border-radius: 20px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    background: linear-gradient(135deg, var(--bg-type1) 25%, var(--bg-type2) 75%);
      color: white;

      @each $type, $color in $type-colors {
        &.type1-#{$type} {
          --bg-type1: #{$color};
          --bg-type2: #{$color};
        }
        
        &.type2-#{$type} {
          --bg-type2: #{$color} !important;
        }
      }

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    &__title {
      color: white;
      width: 100%;
      white-space: break-spaces;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      padding: 6px;

      @media (max-width: 768px){
        font-size: 11px;
        height: 50px;
        padding: 4px;
      }
    }

    &__images{
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    &__image {
      padding: 10px;
      height: 160px;
      object-fit: contain;
      width: 100%;
      filter: brightness(0) invert(0);
      -webkit-user-drag: none;

      @media (max-width: 768px){
        height: 100px;
      }
    }

    &__count{
      position: absolute;
      bottom: 10px;
      right: 10px;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 0.9rem;
      z-index: 2;
    }

    &.pokemon-caught{
      

      .pokecards__pokecard__images {
        background: none;
      }
      .pokecards__pokecard__image {
        filter: unset;
      }
    }
  }
}
</style>
