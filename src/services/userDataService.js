import { firebaseConfig, isFirebaseConfigured } from "./firebase";
import { getValidSession } from "./authService";

const CLOUD_FIELDS = {
  onboarding: "onboardingJson",
  periodLogs: "periodLogsJson",
  weightLogs: "weightLogsJson",
  dailyLogs: "dailyLogsJson",
  doctorNotes: "doctorNotesJson",
  settings: "settingsJson"
};

function getUserDocumentUrl(uid, updateFields = []) {
  const databaseId = encodeURIComponent(firebaseConfig.databaseId || "default");
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/users/${uid}`;

  if (updateFields.length === 0) {
    return baseUrl;
  }

  const masks = updateFields
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  return `${baseUrl}?${masks}`;
}

function parseCloudFields(fields = {}) {
  return Object.entries(CLOUD_FIELDS).reduce((result, [localKey, cloudKey]) => {
    const rawValue = fields[cloudKey]?.stringValue;

    if (rawValue) {
      try {
        result[localKey] = JSON.parse(rawValue);
      } catch (error) {
        result[localKey] = localKey.endsWith("Logs") ? [] : null;
      }
    }

    return result;
  }, {});
}

export async function loadUserDataFromCloud() {
  if (!isFirebaseConfigured) {
    return null;
  }

  const session = await getValidSession();

  if (!session || !session.idToken) {
    return null;
  }

  const response = await fetch(getUserDocumentUrl(session.uid), {
    headers: {
      Authorization: `Bearer ${session.idToken}`
    }
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Could not load Firestore data.");
  }

  return parseCloudFields(data.fields);
}

export async function saveUserDataPatch(patch) {
  if (!isFirebaseConfigured) {
    return;
  }

  const session = await getValidSession();

  if (!session || !session.idToken) {
    return;
  }

  const fields = {};
  const updateFields = [];

  Object.entries(patch).forEach(([localKey, value]) => {
    const cloudKey = CLOUD_FIELDS[localKey];

    if (cloudKey) {
      fields[cloudKey] = { stringValue: JSON.stringify(value) };
      updateFields.push(cloudKey);
    }
  });

  if (updateFields.length === 0) {
    return;
  }

  const response = await fetch(getUserDocumentUrl(session.uid, updateFields), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Could not save Firestore data.");
  }
}
