import {
  Brain,
  Briefcase,
  CheckCircle2,
  Circle,
  Compass,
  Crosshair,
  Dumbbell,
  Heart,
  Home,
  Languages,
  Leaf,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import type { CharacterStatType } from "@/store/appState.types"

const STAT_ICON_BY_TYPE: Record<CharacterStatType, LucideIcon> = {
  intelligence: Brain,
  language: Languages,
  focus: Crosshair,
  discipline: CheckCircle2,
  career: Briefcase,
  skills: Wrench,
  finance: Wallet,
  entrepreneurship: TrendingUp,
  health: Heart,
  strength: Dumbbell,
  energy: Zap,
  social: Users,
  relationships: Users,
  charisma: Sparkles,
  creativity: Sparkles,
  mindfulness: Leaf,
  lifestyle: Home,
  adventure: Compass,
}

type CharacterStatIconProps = {
  statType?: CharacterStatType
  className?: string
}

export function CharacterStatIcon({
  statType,
  className,
}: CharacterStatIconProps) {
  const Icon = statType ? STAT_ICON_BY_TYPE[statType] ?? Circle : Circle
  return <Icon aria-hidden="true" className={className} />
}
