// This ensures the Chat ID is always sorted alphabetically (e.g. "userA_userB")
// regardless of who initiates the chat.
export const getChatId = (uid1: string, uid2: string) => {
  if (!uid1 || !uid2) return "invalid_chat";
  return [uid1, uid2].sort().join("_");
};