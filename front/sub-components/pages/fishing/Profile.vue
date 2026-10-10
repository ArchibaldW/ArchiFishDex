<script setup>
import { fisherService } from '~/_services';

const props = defineProps({
  username: { type: String, required: true },
  isOwnUser: { type: Boolean, default: false }
});

const emit = defineEmits(['view-pokedex']);
const profile = ref(null);
const pokemonCatalog = ref([]);
const loadError = ref('');
const editError = ref('');
const selectedTitleAchievementNumber = ref(null);
const draftDisplayName = ref('');
const draftFavoritePokemonCode = ref(null);
const draftFavoritePokemonShiny = ref(false);
const editing = ref(false);
const savingProfile = ref(false);
const ready = ref(false);

const pokemonByCode = computed(() => new Map(
  pokemonCatalog.value.map(pokemon => [pokemon.code, pokemon])
));

function pokemonName(catchItem) {
  if (!catchItem?.code) return '';
  return pokemonByCode.value.get(catchItem.code)?.name || `#${catchItem.code}`;
}

const pokemonOptions = computed(() => pokemonCatalog.value.map(pokemon => ({
  title: pokemon.name,
  value: pokemon.code
})));

function spriteUrl(catchItem) {
  return `/assets/${catchItem.code}${catchItem.shiny ? 's' : ''}.png`;
}

function formatDate(date) {
  if (!date) return 'Aucune capture';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(date));
}

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
}

async function loadProfile() {
  ready.value = false;
  loadError.value = '';
  profile.value = null;

  try {
    const [profileResult, catalogResult] = await Promise.all([
      fisherService.getUserProfile(props.username),
      fisherService.getUserPokedex()
    ]);

    if (!profileResult || profileResult.error) {
      throw new Error(profileResult?.error || 'Impossible de charger ce profil.');
    }

    profile.value = profileResult;
    selectedTitleAchievementNumber.value = profileResult.selectedTitle?.achievementNumber ?? null;
    draftDisplayName.value = profileResult.displayName || profileResult.username;
    draftFavoritePokemonCode.value = profileResult.favoritePokemonCode || null;
    draftFavoritePokemonShiny.value = profileResult.favoritePokemonShiny === true;
    pokemonCatalog.value = Array.isArray(catalogResult) ? catalogResult : [];
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Impossible de charger ce profil.';
  } finally {
    ready.value = true;
  }
}

function startEditing() {
  draftDisplayName.value = profile.value.displayName || profile.value.username;
  selectedTitleAchievementNumber.value = profile.value.selectedTitle?.achievementNumber ?? null;
  draftFavoritePokemonCode.value = profile.value.favoritePokemonCode || null;
  draftFavoritePokemonShiny.value = profile.value.favoritePokemonShiny === true;
  editError.value = '';
  editing.value = true;
}

function cancelEditing() {
  editing.value = false;
  editError.value = '';
  draftDisplayName.value = profile.value.displayName || profile.value.username;
  selectedTitleAchievementNumber.value = profile.value.selectedTitle?.achievementNumber ?? null;
  draftFavoritePokemonCode.value = profile.value.favoritePokemonCode || null;
  draftFavoritePokemonShiny.value = profile.value.favoritePokemonShiny === true;
}

async function saveProfile() {
  if (!props.isOwnUser || savingProfile.value) return;

  const normalizedDisplayName = draftDisplayName.value.trim();
  if (!normalizedDisplayName || normalizedDisplayName.length > 32) {
    editError.value = 'Le nom d’affichage doit contenir entre 1 et 32 caractères.';
    return;
  }

  editError.value = '';
  savingProfile.value = true;

  try {
    const result = await fisherService.updateUserProfile(
      normalizedDisplayName,
      selectedTitleAchievementNumber.value,
      draftFavoritePokemonCode.value,
      draftFavoritePokemonShiny.value
    );
    if (!result || result.error) {
      throw new Error(result?.error || 'Impossible d’enregistrer le profil.');
    }

    profile.value.displayName = result.displayName;
    profile.value.favoritePokemonCode = result.favoritePokemonCode;
    profile.value.favoritePokemonShiny = result.favoritePokemonShiny;
    profile.value.selectedTitle = result.selectedTitle;
    draftDisplayName.value = result.displayName;
    editing.value = false;
  } catch (error) {
    editError.value = error instanceof Error ? error.message : 'Impossible d’enregistrer le profil.';
  } finally {
    savingProfile.value = false;
  }
}

watch(() => props.username, loadProfile, { immediate: true });
</script>

<template>
  <main class="profile">
    <p v-if="loadError" class="profile__message">{{ loadError }}</p>
    <div v-else-if="!ready" class="profile__loading">
      <v-progress-circular indeterminate color="amber" />
    </div>

    <template v-else-if="profile">
      <header class="profile__header">
        <div class="profile__avatar">
          <img
            v-if="profile.favoritePokemonCode"
            class="profile__avatar-sprite"
            :src="`/assets/${profile.favoritePokemonCode}${profile.favoritePokemonShiny ? 's' : ''}.png`"
            :alt="pokemonName({ code: profile.favoritePokemonCode })"
          >
          <v-icon v-else icon="mdi-account" size="42" />
        </div>
        <div class="profile__identity">
          <div class="profile__display-name">
            <v-text-field
              v-if="editing"
              v-model="draftDisplayName"
              variant="outlined"
              density="compact"
              hide-details
              maxlength="32"
              counter="32"
              aria-label="Nom d’affichage"
              :disabled="savingProfile"
              class="profile__display-name-input"
            />
            <h1 v-else class="profile__title">{{ profile.displayName || profile.username }}</h1>
            <v-btn
              v-if="props.isOwnUser && !editing"
              icon="mdi-pencil"
              variant="text"
              size="small"
              aria-label="Modifier le nom d’affichage et le titre"
              title="Modifier le nom d’affichage et le titre"
              @click="startEditing"
            />
          </div>
          <div class="profile__identity-details">
            <p class="profile__username">@{{ profile.username }}</p>
            <span
              v-if="profile.selectedTitle || (editing && profile.unlockedTitles?.length)"
              class="profile__identity-separator"
              aria-hidden="true"
            >-</span>
            <v-select
              v-if="editing && profile.unlockedTitles?.length"
              v-model="selectedTitleAchievementNumber"
              :items="[
                { title: 'Aucun titre', achievementNumber: null },
                ...profile.unlockedTitles
              ]"
              item-title="title"
              item-value="achievementNumber"
              label="Titre"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="savingProfile"
              class="profile__title-select"
            />
            <p v-else-if="profile.selectedTitle" class="profile__username profile__selected-title">
              {{ profile.selectedTitle.title }}
            </p>
          </div>
          <p v-if="editing && !profile.unlockedTitles?.length" class="profile__no-titles">
            Aucun titre débloqué pour le moment
          </p>
        </div>
        <div v-if="props.isOwnUser" class="profile__actions">
          <template v-if="editing">
            <v-btn
              variant="text"
              :disabled="savingProfile"
              @click="cancelEditing"
            >
              Annuler
            </v-btn>
            <v-btn
              color="amber"
              variant="flat"
              prepend-icon="mdi-content-save"
              :loading="savingProfile"
              @click="saveProfile"
            >
              Enregistrer
            </v-btn>
          </template>
        </div>
        <button
          v-else
          class="profile__pokedex-link"
          type="button"
          @click="emit('view-pokedex', profile.username)"
        >
          Voir son Pokédex
          <v-icon icon="mdi-arrow-top-right" size="18" />
        </button>
      </header>
      <p v-if="editError" class="profile__title-error" role="alert">
        {{ editError }}
      </p>
      <section v-if="editing" class="profile__favorite-editor" aria-label="Modifier le Pokémon préféré">
        <h2>Pokémon préféré</h2>
        <v-autocomplete
          v-model="draftFavoritePokemonCode"
          :items="pokemonOptions"
          item-title="title"
          item-value="value"
          label="Rechercher un Pokémon"
          placeholder="Aucun"
          clearable
          variant="outlined"
          density="compact"
          hide-details
          :disabled="savingProfile"
          class="profile__favorite-select"
        />
        <v-checkbox
          v-model="draftFavoritePokemonShiny"
          label="Shiny"
          density="compact"
          hide-details
          :disabled="savingProfile || !draftFavoritePokemonCode"
          class="profile__favorite-shiny"
        />
      </section>
      <div v-if="props.isOwnUser" class="profile__own-pokedex-link">
        <button class="profile__pokedex-link" type="button" @click="emit('view-pokedex', profile.username)">
          Voir mon Pokédex
          <v-icon icon="mdi-arrow-top-right" size="18" />
        </button>
      </div>

      <section class="profile__dates" aria-label="Dates des captures">
        <article class="profile-card profile-card--date">
          <v-icon icon="mdi-fish" class="profile-card__icon" />
          <div>
            <h2>Première capture</h2>
            <p>{{ formatDate(profile.firstCatchDate) }}</p>
          </div>
        </article>
        <article class="profile-card profile-card--date">
          <v-icon icon="mdi-fish" class="profile-card__icon" />
          <div>
            <h2>Dernière capture</h2>
            <p>{{ formatDate(profile.lastCatchDate) }}</p>
          </div>
        </article>
      </section>

      <section class="profile__records">
        <h2 class="profile__section-title">Captures remarquables</h2>
        <div class="profile__record-grid">
          <article v-if="profile.bestValueCatch" class="profile-card profile-record">
            <h3 class="profile-record__label">Meilleur prix</h3>
            <img
              class="profile-record__sprite"
              :src="spriteUrl(profile.bestValueCatch)"
              :alt="pokemonName(profile.bestValueCatch)"
            >
            <p class="profile-record__pokemon">
              {{ pokemonName(profile.bestValueCatch) }}
              <span v-if="profile.bestValueCatch.shiny" aria-label="Shiny">✨</span>
            </p>
            <p class="profile-record__value">{{ formatNumber(profile.bestValueCatch.value) }} or</p>
          </article>
          <p v-else class="profile__message">Aucun record de prix pour le moment.</p>

          <article v-if="profile.bestWeightCatch" class="profile-card profile-record">
            <h3 class="profile-record__label">Meilleur poids</h3>
            <img
              class="profile-record__sprite"
              :src="spriteUrl(profile.bestWeightCatch)"
              :alt="pokemonName(profile.bestWeightCatch)"
            >
            <p class="profile-record__pokemon">
              {{ pokemonName(profile.bestWeightCatch) }}
              <span v-if="profile.bestWeightCatch.shiny" aria-label="Shiny">✨</span>
            </p>
            <p class="profile-record__value">{{ formatNumber(profile.bestWeightCatch.weight) }} kg</p>
          </article>
          <p v-else class="profile__message">Aucun record de poids pour le moment.</p>

          <article v-if="profile.mostCaughtNormal" class="profile-card profile-record">
            <h3 class="profile-record__label">Pokémon normal le plus capturé</h3>
            <img
              class="profile-record__sprite"
              :src="`/assets/${profile.mostCaughtNormal.code}.png`"
              :alt="pokemonName(profile.mostCaughtNormal)"
            >
            <p class="profile-record__pokemon">{{ pokemonName(profile.mostCaughtNormal) }}</p>
            <p class="profile-record__value">{{ formatNumber(profile.mostCaughtNormal.count) }} captures</p>
          </article>
          <p v-else class="profile__message">Aucune capture normale pour le moment.</p>

          <article v-if="profile.mostCaughtShiny" class="profile-card profile-record">
            <h3 class="profile-record__label">Pokémon shiny le plus capturé</h3>
            <img
              class="profile-record__sprite"
              :src="`/assets/${profile.mostCaughtShiny.code}s.png`"
              :alt="pokemonName(profile.mostCaughtShiny)"
            >
            <p class="profile-record__pokemon">
              {{ pokemonName(profile.mostCaughtShiny) }} <span aria-label="Shiny">✨</span>
            </p>
            <p class="profile-record__value">{{ formatNumber(profile.mostCaughtShiny.count) }} captures</p>
          </article>
          <p v-else class="profile__message">Aucune capture shiny pour le moment.</p>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
.profile {
  box-sizing: border-box;
  min-height: calc(100vh - 80px);
  padding: 8px 20px 14px;
  color: white;

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    color: rgba(255, 255, 255, 0.8);
    background: transparent;
    font: inherit;
    cursor: pointer;

    &:hover {
      color: #ffcf5c;
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 48px 0;
  }

  &__header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto 22px;
  }

  &__avatar {
    display: grid;
    overflow: hidden;
    width: 60px;
    height: 60px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }

  &__avatar-sprite {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__title {
    min-width: 0;
    overflow: hidden;
    font-size: clamp(26px, 3.5vw, 36px);
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__identity {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  &__display-name {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
  }

  &__username {
    color: rgba(255, 255, 255, 0.6);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
  }

  &__identity-separator {
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 500;
  }

  &__identity-details {
    display: flex;
    min-width: 0;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__title-select {
    width: 220px;
    color: white;
  }

  &__display-name-input {
    width: min(100%, 360px);
    color: white;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }

  &__own-pokedex-link {
    display: flex;
    justify-content: center;
    margin: -10px auto 16px;
  }

  &__selected-title {
    color: #ffdf91;
  }

  &__favorite-editor {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 1000px;
    margin: 0 auto 14px;
    padding: 10px 14px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);

    h2 {
      flex: 0 0 auto;
      font-size: 14px;
    }
  }

  &__favorite-select {
    width: min(100%, 300px);
    color: white;
  }

  &__favorite-shiny {
    width: 82px;
    flex: 0 0 auto;
    color: white;
  }

  &__no-titles,
  &__title-error {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
  }

  &__title-error {
    max-width: 1000px;
    margin: -8px auto 12px;
    color: #ffb4ab;
  }

  &__pokedex-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border: 1px solid rgba(255, 207, 92, 0.5);
    border-radius: 999px;
    color: #ffdf91;
    background: rgba(255, 207, 92, 0.1);
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(255, 207, 92, 0.2);
    }
  }

  &__record-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    max-width: 1000px;
    margin: 0 auto;
  }

  &__dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    max-width: 1000px;
    margin: 0 auto;
  }

  &__section-title {
    max-width: 1000px;
    margin: 16px auto 12px;
    font-size: 21px;
  }

  &__message {
    max-width: 900px;
    margin: 8px auto;
    padding: 10px;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.08);
  }
}

.profile-card {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(44, 61, 99, 0.78), rgba(27, 35, 67, 0.88));
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);

  &--date {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;

    h2 {
      font-size: 14px;
    }

    p {
      margin-top: 2px;
      color: #ffdf91;
      font-size: 16px;
      font-weight: 700;
    }
  }

  &__icon {
    color: #ffcf5c;
  }
}

.profile-record {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto auto auto;
  align-items: center;
  justify-items: center;
  gap: 4px;
  min-width: 0;
  min-height: 170px;
  padding: 10px;

  &__label {
    width: 100%;
    min-height: 2.5em;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    line-height: 1.25;
    text-align: center;
  }

  &__sprite {
    width: 68px;
    height: 68px;
    object-fit: contain;
  }

  &__pokemon {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value {
    max-width: 100%;
    margin-top: 0;
    overflow-wrap: anywhere;
    color: #ffcf5c;
    font-size: clamp(12px, 1.6vw, 18px);
    font-weight: 800;
    text-align: center;
  }
}

@media (max-width: 600px) {
  .profile {
    padding: 8px 12px 12px;

    &__header {
      grid-template-columns: 48px minmax(0, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    &__avatar {
      width: 48px;
      height: 48px;
    }

    &__pokedex-link {
      grid-column: 1 / -1;
      justify-self: center;
      margin-top: 0;
    }

    &__identity {
      align-items: flex-start;
    }

    &__title-select {
      width: min(100%, 240px);
    }

    &__dates {
      gap: 7px;
    }

    &__record-grid {
      gap: 6px;
    }

    &__favorite-editor {
      flex-wrap: wrap;
      gap: 8px;
    }

    &__favorite-select {
      flex: 1 1 180px;
    }
  }

  .profile-card--date {
    gap: 6px;
    padding: 10px;

    p {
    font-size: 14px;
    }
  }

  .profile-record {
    min-height: 142px;
    gap: 2px;
    padding: 7px 4px;

    &__sprite {
      width: 48px;
      height: 48px;
    }

    &__pokemon {
      font-size: 12px;
    }

    &__value {
      font-size: 11px;
    }

    &__label {
      font-size: 11px;
    }
  }
}

@media (max-width: 360px) {
  .profile__dates {
    grid-template-columns: 1fr;
  }
}
</style>
