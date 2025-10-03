import { Button } from "./button";

interface ActionButtonsProps {
  onInvite?: () => void;
  onAddModule?: () => void;
}

export function ActionButtons({ onInvite, onAddModule }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 mb-6">
      <Button
        variant="outline"
        className="flex-1 bg-[color:var(--primary)]/10 text-[color:var(--primary)] border-[color:var(--primary)]/20 hover:bg-[color:var(--primary)]/20"
        onClick={onInvite}
      >
        <span className="truncate">Invite</span>
      </Button>
      <Button
        className="flex-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-hover)]"
        onClick={onAddModule}
      >
        <span className="truncate">Add module</span>
      </Button>
    </div>
  );
}