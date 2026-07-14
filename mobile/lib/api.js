export const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const raw = await response.text();

  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    const hint = raw?.trim?.().startsWith("<")
      ? "Server returned HTML instead of JSON."
      : "Server returned an invalid response format.";
    throw new Error(`${response.status} ${response.statusText}. ${hint}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `${response.status} ${response.statusText}`);
  }

  return data;
};
