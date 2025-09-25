import Link from "next/link";
import { Card, CardContent } from "./card";
import { 
  UserPlus, 
  Users, 
  Settings, 
  CreditCard, 
  Puzzle
} from "lucide-react";

interface ShortcutItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  onClick?: () => void;
}

function ShortcutItem({ icon, title, href, onClick }: ShortcutItemProps) {
  const isSpecialAction = href.startsWith('#');
  
  if (isSpecialAction) {
    return (
      <button onClick={onClick}>
        <Card className="border-border transition-colors hover:bg-muted/50 w-full">
          <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="text-primary text-3xl">
              {icon}
            </div>
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          </CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Link href={href}>
      <Card className="border-border transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <div className="text-primary text-3xl">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ShortcutsGridProps {
  shortcuts: Array<{
    icon: "invite" | "roles" | "settings" | "billing" | "modules" | string;
    title: string;
    href: string;
  }>;
  onShortcutClick?: (href: string) => void;
}

export function ShortcutsGrid({ shortcuts, onShortcutClick }: ShortcutsGridProps) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "invite":
        return <UserPlus className="h-6 w-6" />;
      case "roles":
        return <Users className="h-6 w-6" />;
      case "settings":
        return <Settings className="h-6 w-6" />;
      case "billing":
        return <CreditCard className="h-6 w-6" />;
      case "modules":
        return <Puzzle className="h-6 w-6" />;
      default:
        return <Settings className="h-6 w-6" />;
    }
  };

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">Shortcuts</h2>
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut, index) => (
          <ShortcutItem
            key={index}
            icon={getIcon(shortcut.icon)}
            title={shortcut.title}
            href={shortcut.href}
            onClick={() => onShortcutClick?.(shortcut.href)}
          />
        ))}
      </div>
    </section>
  );
}