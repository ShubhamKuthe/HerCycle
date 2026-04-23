import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig, isFirebaseConfigured } from "./firebase";

const SESSION_KEY = "@hercycle/firebaseSession";
const listeners = new Set();
let currentSession = null;

function ensureFirebaseReady() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured yet. Add your HerCycle Firebase config values first."
    );
  }
}

function normalizeSession(response) {
  const expiresInMs = Number(response.expiresIn || 3600) * 1000;

  return {
    uid: response.localId,
    email: response.email,
    idToken: response.idToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + expiresInMs - 60000
  };
}

async function saveSession(session) {
  currentSession = session;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  listeners.forEach((listener) => listener(session));
}

async function readStoredSession() {
  const value = await AsyncStorage.getItem(SESSION_KEY);
  currentSession = value ? JSON.parse(value) : null;
  if (currentSession?.isLocalFallback) {
    currentSession = null;
    await AsyncStorage.removeItem(SESSION_KEY);
  }
  return currentSession;
}

async function authRequest(endpoint, body) {
  ensureFirebaseReady();

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message;

    if (message === "API key not valid. Please pass a valid API key.") {
      const error = new Error(
        "Firebase API key is invalid. Copy the exact apiKey from Firebase Project settings > Your apps > Web app and paste it into .env."
      );
      error.code = "API_KEY_INVALID";
      throw error;
    }

    throw new Error(message || "Firebase authentication failed.");
  }

  return data;
}

async function refreshSession(session) {
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        session.refreshToken
      )}`
    }
  );

  const data = await response.json();

  if (!response.ok) {
    await logoutUser();
    throw new Error(data?.error?.message || "Firebase session expired.");
  }

  const nextSession = {
    uid: data.user_id,
    email: session.email,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 - 60000
  };

  await saveSession(nextSession);
  return nextSession;
}

export function listenToAuthState(callback) {
  listeners.add(callback);
  readStoredSession().then(callback).catch(() => callback(null));
  return () => listeners.delete(callback);
}

export async function loginWithEmail(email, password) {
  const data = await authRequest("accounts:signInWithPassword", {
    email: email.trim(),
    password,
    returnSecureToken: true
  });
  const session = normalizeSession(data);
  await saveSession(session);
  return session;
}

export async function registerWithEmail(email, password) {
  const data = await authRequest("accounts:signUp", {
    email: email.trim(),
    password,
    returnSecureToken: true
  });
  const session = normalizeSession(data);
  await saveSession(session);
  return session;
}

export async function logoutUser() {
  currentSession = null;
  await AsyncStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(null));
}

export function getCurrentUser() {
  return currentSession;
}

export async function getValidSession() {
  const session = currentSession || (await readStoredSession());

  if (!session) {
    return null;
  }

  if (session.expiresAt && session.expiresAt <= Date.now()) {
    return refreshSession(session);
  }

  return session;
}
