export interface IconDefinition {
  id: string;
  label: string;
  component: string;
}

export const ICON_PALETTE: IconDefinition[] = [
  { id: 'globe', label: 'Globe', component: 'Globe' },
  { id: 'star', label: 'Star', component: 'Star' },
  { id: 'bookmark', label: 'Bookmark', component: 'Bookmark' },
  { id: 'folder', label: 'Folder', component: 'Folder' },
  { id: 'home', label: 'Home', component: 'Home' },
  { id: 'briefcase', label: 'Briefcase', component: 'Briefcase' },
  { id: 'graduation-cap', label: 'Graduation Cap', component: 'GraduationCap' },
  { id: 'code', label: 'Code', component: 'Code2' },
  { id: 'shopping-cart', label: 'Shopping Cart', component: 'ShoppingCart' },
  { id: 'heart', label: 'Heart', component: 'Heart' },
  { id: 'camera', label: 'Camera', component: 'Camera' },
  { id: 'music-note', label: 'Music Note', component: 'Music' },
  { id: 'video', label: 'Video', component: 'Video' },
  { id: 'newspaper', label: 'Newspaper', component: 'Newspaper' },
  { id: 'message-circle', label: 'Message Circle', component: 'MessageCircle' },
  { id: 'wrench', label: 'Wrench', component: 'Wrench' },
  { id: 'shield', label: 'Shield', component: 'Shield' },
  { id: 'cloud', label: 'Cloud', component: 'Cloud' },
  { id: 'calendar', label: 'Calendar', component: 'Calendar' },
  { id: 'link', label: 'Link', component: 'Link' },
];

export function getIconById(id: string): IconDefinition | undefined {
  return ICON_PALETTE.find(icon => icon.id === id);
}
