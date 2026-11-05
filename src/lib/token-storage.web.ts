export const secureTokenStorageAvailable = false;

export async function getAccessToken(): Promise<string | null> {
  return null;
}

export async function saveAccessToken(): Promise<void> {
  throw new Error("Sign-in is available in the installed mobile app.");
}

export async function clearAccessToken(): Promise<void> {}
