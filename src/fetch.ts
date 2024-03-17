const DEFAULT_OPTIONS = {
  headers: { "Content-Type": "application/json" },
};

export default function fetchJSON(
  url: RequestInfo,
  { headers, ...rest }: RequestInit = {}
) {
  return fetch(url, {
    headers: { ...DEFAULT_OPTIONS.headers, ...headers },
    ...rest,
  }).then((res) => {
    if (res.ok) return res.json();
    return res.json().then((json) => Promise.reject(json));
  });
}
