import React from 'react';
import {
  Globe,
  Star,
  Bookmark,
  Folder,
  Home,
  Briefcase,
  GraduationCap,
  Code2,
  ShoppingCart,
  Heart,
  Camera,
  Music,
  Video,
  Newspaper,
  MessageCircle,
  Wrench,
  Shield,
  Cloud,
  Calendar,
  Link,
  type LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  globe: Globe,
  star: Star,
  bookmark: Bookmark,
  folder: Folder,
  home: Home,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  code: Code2,
  'shopping-cart': ShoppingCart,
  heart: Heart,
  camera: Camera,
  'music-note': Music,
  video: Video,
  newspaper: Newspaper,
  'message-circle': MessageCircle,
  wrench: Wrench,
  shield: Shield,
  cloud: Cloud,
  calendar: Calendar,
  link: Link,
};

interface IconDisplayProps extends LucideProps {
  iconId: string;
}

export function IconDisplay({ iconId, size = 18, ...props }: IconDisplayProps) {
  const Component = ICON_MAP[iconId] ?? Globe;
  return <Component size={size} {...props} />;
}
