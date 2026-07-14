import { requestOptions, handle } from '~/_helpers';

export const fisherService = {
    getUserPokedex,
    getUserStatistics,
    getUserAchievements,
    getLeaderboards,
    getUserLastCatches
}

async function getUserPokedex(): Promise<any> {
  return fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/users/pokedex/`, requestOptions.get() as RequestInit)
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