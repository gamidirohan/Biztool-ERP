import Link from "next/link";
import { Card, CardContent } from "./card";
import { ChevronRight, FileText, Bell } from "lucide-react";

interface PriorityItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}

function PriorityItem({ icon, title, subtitle, href }: PriorityItemProps) {
  return (
    <Link href={href}>
      <Card className="border-border transition-colors hover:bg-muted/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div className="flex-grow">
              <p className="font-medium text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface PriorityTasksProps {
  tasks: Array<{
    icon: "approvals" | "activity" | string;
    title: string;
    subtitle: string;
    href: string;
  }>;
}

export function PriorityTasks({ tasks }: PriorityTasksProps) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "approvals":
        return <FileText className="h-5 w-5" />;
      case "activity":
        return <Bell className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">Priority</h2>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <PriorityItem
            key={index}
            icon={getIcon(task.icon)}
            title={task.title}
            subtitle={task.subtitle}
            href={task.href}
          />
        ))}
      </div>
    </section>
  );
}