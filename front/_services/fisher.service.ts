import { requestOptions, handle } from '~/_helpers';

export const fisherService = {
    getUserPokedex,
    getPokedexUsers,
    getUserProfile,
    updateUserProfile,
    getUserStatistics,
    getUserAchievements,
    getLeaderboards,
    getUserLastCatches
}

async function getUserPokedex(options: { username?: string; global?: boolean } = {}): Promise<any> {
  const query = new URLSearchParams();
  if (options.username) query.set('username', options.username);
  if (options.global) query.set('global', 'true');
  const queryString = query.toString();

  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/pokedex/${queryString ? `?${queryString}` : ''}`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function getPokedexUsers(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/pokedex/users/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function getUserProfile(username: string): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/profile/${encodeURIComponent(username)}/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function updateUserProfile(displayName: string, achievementNumber: number | null, favoritePokemonCode: string | null, favoritePokemonShiny: boolean): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/profile/`, requestOptions.patch({ displayName, achievementNumber, favoritePokemonCode, favoritePokemonShiny }) as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function getUserStatistics(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/statistics/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function getUserAchievements(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/achievements/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function getLeaderboards(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/leaderboards/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}

async function getUserCatches(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/usercatches/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}


async function getUserLastCatches(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/usercatches/last/`, requestOptions.get() as RequestInit)
    .then((res) => {
      return handle.response(res);
    })
    .catch((error) => {
      handle.error(error);
    });
}