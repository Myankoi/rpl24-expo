const VOTED_KEY_PREFIX = "rplexpo_voted:";

function key(eventSlug: string) {
  return `${VOTED_KEY_PREFIX}${eventSlug}`;
}

export function markAsVoted(eventSlug: string) {
  try {
    localStorage.setItem(key(eventSlug), "1");
  } catch {
    /* The server-side ticket remains the source of truth. */
  }
}

export function hasVotedLocally(eventSlug: string) {
  try {
    return localStorage.getItem(key(eventSlug)) === "1";
  } catch {
    return false;
  }
}
