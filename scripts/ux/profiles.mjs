const ALL = ['tasks', 'surfaces', 'docs']

// The theme is stored under localStorage "sd-theme", the key setTheme() writes and the page's head script reads.
export const PROFILES = [
  { id: 'desktop', viewport: { width: 1280, height: 800 }, touch: false, theme: 'ink', measures: ALL },
  { id: 'desktop-paper', viewport: { width: 1280, height: 800 }, touch: false, theme: 'paper', measures: ['surfaces'] },
  { id: 'phone', viewport: { width: 390, height: 844 }, touch: true, theme: 'ink', measures: ALL },
]

export function isPhone(profile) {
  return profile.viewport.width <= 768
}
