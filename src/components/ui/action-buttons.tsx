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
        className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
        onClick={onInvite}
      >
        <span className="truncate">Invite</span>
      </Button>
      <Button
        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={onAddModule}
      >
        <span className="truncate">Add module</span>
      </Button>
    </div>
  );
}