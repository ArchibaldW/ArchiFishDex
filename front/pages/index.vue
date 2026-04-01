<script setup>
import { useUserStore } from '~/store';

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const redirectUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${useRuntimeConfig().public.clientId}&redirect_uri=${useRuntimeConfig().public.apiRedirectUrl}/api/auth/twitch/callback&scope=user:read:email`
</script>

<template>
  <div class="container">
    <div v-if="!user" class="welcome">
      <h1 class="welcome__title">Bienvenue chez Les Evolis Sauvages mais gentils</h1>
      <p class="welcome__description">Connectez-vous avec Twitch pour commencer votre aventure.</p>
      <v-btn 
        :href="redirectUrl"
        size="large"
      >
        Se connecter avec Twitch
      </v-btn>
    </div>

    <div v-else class="welcome">
      <h1 class="welcome__title">Bienvenue {{ user.username }} ! 🎉</h1>
      <p class="welcome__subtitle">Ton aventure de Pêcheur de Pokémon t'attend</p>
      <v-btn 
        to="/fishing"
        size="large"
      >
        Accéder à l'Application
      </v-btn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
  padding : 0 50px
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  gap: 20px;

  &__title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    margin: 0;
  }

  &__subtitle {
    font-size: 32px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }

  &__description {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    max-width: 500px;
    margin: 0;
  }

  &__btn {
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .welcome {
    &__title {
      font-size: 32px;
    }

    &__subtitle {
      font-size: 24px;
    }
  }
}
</style>