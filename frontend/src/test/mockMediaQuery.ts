export function mockMediaQuery(expectedQuery: string) {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = (query) => ({
    matches: query === expectedQuery,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });

  return () => {
    window.matchMedia = originalMatchMedia;
  };
}
