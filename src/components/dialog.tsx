import { type DialogProps } from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// TODO: Use this everywhere

export const SDialog = ({
  children,
  title,

  ...props
}: {
  children: React.ReactNode;
  title?: React.ReactNode | string;
} & DialogProps) => {
  const dialogTitle = <DialogTitle>{title ?? "Title"}</DialogTitle>;
  const titleComponent = title ? (
    dialogTitle
  ) : (
    <VisuallyHidden>{dialogTitle}</VisuallyHidden>
  );

  return (
    <Dialog {...props}>
      {titleComponent}
      <DialogContent
        className="flex w-[95vw] max-w-xl flex-col justify-between rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};
