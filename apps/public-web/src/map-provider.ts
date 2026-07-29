export type MapProvider = "kakao" | "openstreetmap";

export function getMapProvider(kakaoJavaScriptKey: string): MapProvider {
  return kakaoJavaScriptKey.trim() ? "kakao" : "openstreetmap";
}

export function buildOpenStreetMapEmbedUrl(latitude: number, longitude: number): string {
  const latitudePadding = 0.008;
  const longitudePadding = 0.012;
  const query = new URLSearchParams({
    bbox: [
      longitude - longitudePadding,
      latitude - latitudePadding,
      longitude + longitudePadding,
      latitude + latitudePadding,
    ].join(","),
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${query.toString()}`;
}

export function getKakaoMapLevel(zoom: number): number {
  return Math.max(1, Math.min(14, 22 - zoom));
}
