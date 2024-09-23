//#region Imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SaveAll } from "lucide-react";
import { toast } from "sonner";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import useRequest from "@/lib/hooks/useRequest";

import { ProjectSelection } from "@/components/project-select";
//#endregion

interface timerAddState {
  start: string;
  end: string;
  notes: string;
  traveledDistance: number | null;
  project: string | null;
}

export default function TimerAdd({
  user,
  projects,
  visible,
  setVisible,
}: {
  user: string;
  projects: Projects;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const router = useRouter();
  const t = useTranslations("History");

  const [data, setData] = useReducer(
    (prev: timerAddState, next: Partial<timerAddState>) => ({
      ...prev,
      ...next,
    }),
    {
      start: new Date().toLocaleString("sv").replace(" ", "T"),
      end: new Date(new Date().setHours(new Date().getHours() + 2))
        .toLocaleString("sv")
        .replace(" ", "T"),
      traveledDistance: null,
      notes: "",
      project: null,
    },
  );

  const { status, send } = useRequest(
    () =>
      fetch("/api/times", {
        method: "POST",
        body: JSON.stringify({
          userId: user,
          notes: data.notes,
          traveledDistance:
            data.traveledDistance === 0 ? null : data.traveledDistance,
          start: new Date(data.start).toISOString(),
          end: new Date(data.end).toISOString(),
          startType: "Website",
          endType: "Website",
          project: data.project ?? undefined,
        }),
      }),
    (_result) => {
      setVisible(false);
      setData({
        start: new Date().toLocaleString("sv").replace(" ", "T"),
        end: new Date(new Date().setHours(new Date().getHours() + 2))
          .toLocaleString("sv")
          .replace(" ", "T"),
        notes: "",
      });

      toast.success(t("Miscellaneous.created"), {
        duration: 5_000,
      });
      router.refresh();
    },
  );

  return (
    <Dialog
      key="timerModal-add"
      open={visible}
      onOpenChange={(e) => setVisible(e)}
    >
      <DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
        <DialogHeader>
          <DialogTitle>
            <div>{t("Dialogs.Create.title")}</div>
          </DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-col gap-2">
          <Tabs defaultValue="details">
            <TabsList className="flex w-full">
              <TabsTrigger className="w-full" value="details">
                {t("Dialogs.Create.details")}
              </TabsTrigger>
              <TabsTrigger className="w-full" value="time">
                {t("Dialogs.Create.time")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <ScrollArea
                className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                type="always"
              >
                <div className="h-full w-full grid p-1 gap-1.5">
                  <Label
                    htmlFor="projects-button"
                    className="pl-2 text-muted-foreground"
                  >
                    {t("Dialogs.Edit.project")}
                  </Label>
                  <ProjectSelection
                    project={data.project ?? undefined}
                    changeProject={(e) => setData({ project: e ?? null })}
                    projects={projects}
                  />
                </div>

                <div id="divider" className="h-4" />

                <div className="h-full w-full grid p-1 gap-1.5">
                  <Label
                    htmlFor="timerModal-notes-add"
                    className="text-muted-foreground pl-2"
                  >
                    {t("Dialogs.Create.notes")}
                  </Label>
                  <Textarea
                    id="timerModal-notes-add"
                    className="h-full min-h-[30svh] max-h-[50svh] border-2 transition duration-300"
                    spellCheck={true}
                    onChange={(e) => setData({ notes: e.target.value })}
                    value={data.notes}
                  />
                </div>

                <div id="divider" className="h-4" />

                <div className="h-full w-full grid p-1 gap-1.5">
                  <Label
                    htmlFor="distance-button"
                    className="pl-2 text-muted-foreground"
                  >
                    {t("Dialogs.Create.distance")}
                  </Label>
                  <Input
                    id="distance-button"
                    type="number"
                    min={0}
                    className="w-full justify-between border-2 transition duration-300"
                    onChange={(change) => {
                      const target = change.target.valueAsNumber;
                      setData({
                        traveledDistance: Number.isNaN(target) ? null : target,
                      });
                    }}
                    value={data.traveledDistance ?? ""}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="time" className="h-full">
              <ScrollArea
                className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                type="always"
              >
                <div className="grid gap-4 p-1 w-full">
                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="name"
                      className="pl-2 text-muted-foreground"
                    >
                      {t("Dialogs.Create.start")}
                    </Label>
                    <Input
                      className="!w-full font-mono border-2 appearance-none"
                      type="datetime-local"
                      name="Updated"
                      id="updated"
                      step={1}
                      value={data.start}
                      onChange={(e) => setData({ start: e.target.value })}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="username"
                      className="pl-2 text-muted-foreground"
                    >
                      {t("Dialogs.Create.end")}
                    </Label>
                    <Input
                      className="w-full font-mono border-2 appearance-none"
                      type="datetime-local"
                      name="Created"
                      id="created"
                      step={1}
                      value={data.end}
                      onChange={(e) => setData({ end: e.target.value })}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="w-full gap-2 flex flex-row justify-end">
            <Button variant="outline" onClick={send} disabled={status.loading}>
              <SaveAll className="mr-2 h-4 w-4" />
              {t("Dialogs.Create.create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
