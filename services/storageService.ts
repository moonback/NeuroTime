import { Mission } from '../types';

const STORAGE_KEY = 'eventflow_missions_v1';

export const saveMissions = (missions: Mission[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch (error) {
    console.error('Failed to save missions to local storage', error);
  }
};

export const loadMissions = (): Mission[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load missions', error);
    return [];
  }
};