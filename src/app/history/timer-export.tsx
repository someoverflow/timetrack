"use client";

//#region Imports
import type { Prisma } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { useTranslations } from "next-intl";
import { useEffect, useReducer, useState } from "react";

import { sumTimes } from "@/lib/utils";
//#endregion

const umlautMap: Record<string, string> = {
  "\u00dc": "UE",
  "\u00c4": "AE",
  "\u00d6": "OE",
  "\u00fc": "ue",
  "\u00e4": "ae",
  "\u00f6": "oe",
  "\u00df": "ss",
};

function replaceUmlaute(str: string) {
  return str
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
      const big = umlautMap[a.slice(0, 1)] ?? "?";
      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(
      new RegExp(`[${Object.keys(umlautMap).join("|")}]`, "g"),
      (a) => umlautMap[a] ?? "?",
    );
}

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;
type Data = Record<string, Timer[]>;

interface visualisationState {
  showProject: boolean;
  showDateColumn: boolean;
  showPerson: boolean;
}

// TODO: Export customer when filter active

export default function TimerExportDialog({
  history,
  yearMonth,
  users,
}: {
  history: Data;
  yearMonth: string;
  users: { id: string; username: string; name: string | null }[] | undefined;
}) {
  const t = useTranslations("History");

  const [visualisation, setVisualisation] = useReducer(
    (prev: visualisationState, next: Partial<visualisationState>) => ({
      ...prev,
      ...next,
    }),
    {
      showProject: true,
      showDateColumn: true,
      showPerson: false,
    },
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const localShowProject = localStorage.getItem(
      "export-visualisation-showProject",
    );
    const localShowDateColumn = localStorage.getItem(
      "export-visualisation-showDateColumn",
    );
    const localShowPersonColumn = localStorage.getItem(
      "export-visualisation-showPersonColumn",
    );

    setVisualisation({
      showProject: (localShowProject ?? "true") === "true",
      showDateColumn: (localShowDateColumn ?? "false") === "true",

      showPerson: (localShowPersonColumn ?? "false") === "true",
    });
  }, []);

  const downloadCSV = () => {
    const exportData = history[yearMonth] ?? [];

    // Prepare Data
    const timeStrings = (exportData || [])
      .map((data) => data.time)
      .filter(Boolean); // Remove all undefined or null
    const totalTime =
      timeStrings.length !== 0 ? sumTimes(timeStrings as string[]) : "00:00:00";

    // Prepare CSV
    let result = "";
    if (visualisation.showDateColumn) result = `${result}Datum;`;
    result = `${result}Beginn;Ende;Dauer;`;
    if (visualisation.showPerson) result = `${result}Person;`;
    if (visualisation.showProject) result = `${result}Projekt;`;
    result = `${result}Notizen`;

    for (const time of exportData.reverse()) {
      if (!time.end) continue;

      result = `${result}\n`;
      if (visualisation.showDateColumn)
        result = `${result}${time.start.toLocaleDateString()};${time.start.toLocaleTimeString()};${time.end?.toLocaleTimeString()};${
          time.time
        }`;
      else
        result = `${result}${time.start.toLocaleString()};${time.end?.toLocaleString()};${
          time.time
        }`;
      if (visualisation.showPerson)
        result = `${result};${users?.find((u) => u.id == time.userId)?.name ?? time.userId}`;
      if (visualisation.showProject)
        result = `${result};${time.project?.name ?? ""}`;
      if (time.notes)
        result = `${result};"${
          time.notes.startsWith("-")
            ? time.notes.replace("-", " -")
            : time.notes
        }"`;
    }

    result = `${result}\n\n`;
    if (visualisation.showDateColumn) result = `${result};`;
    result = `${result};;${totalTime};`;
    if (visualisation.showProject) result = `${result};`;

    result = replaceUmlaute(result);

    // Download CSV
    const element = document.createElement("a");
    const file = new Blob([result], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = `Time ${yearMonth}.csv`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="w-max">
      <Button variant="outline" size="icon" onClick={() => setVisible(true)}>
        <FileDown className="h-5 w-5" />
      </Button>

      <Dialog
        key={"exportModal"}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent className="w-[95vw] top-[25%] max-w-md rounded-lg flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>
              <div>{t("Dialogs.Export.title")}</div>
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-md border p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {t("Dialogs.Export.visualisation.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Dialogs.Export.visualisation.description")}
                </p>
              </div>
            </div>

            <Separator className="my-5" orientation="horizontal" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="date-toggle"
                  checked={visualisation.showDateColumn}
                  onCheckedChange={(value) => {
                    setVisualisation({
                      showDateColumn: value,
                    });
                    localStorage.setItem(
                      "export-visualisation-showDateColumn",
                      `${value}`,
                    );
                  }}
                />
                <Label
                  htmlFor="date-toggle"
                  className="pl-2 text-muted-foreground"
                >
                  {t("Dialogs.Export.visualisation.dateSpecificColumn")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="project-toggle"
                  checked={visualisation.showProject}
                  onCheckedChange={(value) => {
                    setVisualisation({
                      showProject: value,
                    });

                    localStorage.setItem(
                      "export-visualisation-showProject",
                      `${value}`,
                    );
                  }}
                />
                <Label
                  htmlFor="project-toggle"
                  className="pl-2 text-muted-foreground"
                >
                  {t("Dialogs.Export.visualisation.projectSpecificColumn")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="person-toggle"
                  checked={visualisation.showPerson}
                  onCheckedChange={(value) => {
                    setVisualisation({
                      showPerson: value,
                    });

                    localStorage.setItem(
                      "export-visualisation-showPersonColumn",
                      `${value}`,
                    );
                  }}
                />
                <Label
                  htmlFor="person-toggle"
                  className="pl-2 text-muted-foreground"
                >
                  {t("Dialogs.Export.visualisation.personSpecificColumn")}
                </Label>
              </div>
            </div>
          </div>

          <Button onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            {t("Dialogs.Export.download")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
