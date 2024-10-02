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

import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";
//#endregion

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;
type Data = Record<string, Timer[]>;

interface visualisationState {
  showProject: boolean;
  showPerson: boolean;
}

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
      showPerson: false,
    },
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const localShowProject = localStorage.getItem(
      "export-visualisation-showProject",
    );
    const localShowPersonColumn = localStorage.getItem(
      "export-visualisation-showPersonColumn",
    );

    setVisualisation({
      showProject: (localShowProject ?? "true") === "true",
      showPerson: (localShowPersonColumn ?? "false") === "true",
    });
  }, []);

  const downloadCSV = async () => {
    const filteredData = (history[yearMonth] ?? [])
      .filter((e) => e.end != null)
      .sort((a, b) => {
        const aName = users?.find((u) => u.id == a.userId)?.name ?? "";
        const bName = users?.find((u) => u.id == b.userId)?.name ?? "";
        return aName.localeCompare(bName);
      });
    const groupedData = Object.groupBy(filteredData, (i) => i.userId ?? "");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(yearMonth);

    workbook.creator = "TimeTrack";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    sheet.columns = [];

    if (visualisation.showProject)
      sheet.columns = [
        ...sheet.columns,
        { header: "Projekt", key: "project", width: 20 },
      ];
    if (visualisation.showPerson)
      sheet.columns = [
        ...sheet.columns,
        { header: "Person", key: "person", width: 30 },
      ];

    sheet.columns = [
      ...sheet.columns,
      { header: "Datum", key: "date", width: 12 },
      { header: "Start", key: "start", width: 12 },
      { header: "Ende", key: "end", width: 12 },
      { header: "Dauer", key: "duration", width: 12 },
      { header: "Notizen", key: "notes", width: 32 },
      { header: "Distanz", key: "distance", width: 10 },
    ];

    // Center Header Row
    const row = sheet.getRow(1);
    row.font = { bold: true };
    row.alignment = { horizontal: "center", vertical: "middle" };

    let rowIndex = 2;
    const durationCells: string[] = [];

    Object.keys(groupedData).forEach((user) => {
      const times = groupedData[user];
      if (!times) throw new Error();

      const sortedTimes = times.sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );

      for (const time of sortedTimes) {
        if (time.time && time.end) {
          const row = sheet.getRow(rowIndex);

          // Project (when enabled)
          if (visualisation.showProject) {
            row.getCell("project").value = time.project?.name;
            row.getCell("project").alignment = { vertical: "middle" };
          }

          // Person (when enabled)
          if (visualisation.showPerson) {
            row.getCell("person").value = users?.find(
              (u) => u.id == time.userId,
            )?.name;
            row.getCell("person").alignment = { vertical: "middle" };
          }

          // Date
          const dateCell = row.getCell("date");
          dateCell.value = time.start.toLocaleDateString();
          dateCell.alignment = { horizontal: "center", vertical: "middle" };

          // Start
          const startCell = row.getCell("start");
          startCell.numFmt = "hh:mm:ss";
          startCell.alignment = { vertical: "middle" };
          startCell.value = time.start;

          // End
          const endCell = row.getCell("end");
          endCell.numFmt = "hh:mm:ss";
          endCell.alignment = { vertical: "middle" };
          endCell.value = time.end;

          // Duration
          const durationCell = row.getCell("duration");
          durationCell.numFmt = '0,00"h"';
          durationCell.value = {
            formula: `(${endCell.address}-${startCell.address})*24`,
          };
          durationCell.alignment = { vertical: "middle" };

          // Notes
          const notesCell = row.getCell("notes");
          notesCell.value = time.notes;
          notesCell.alignment = { wrapText: true };

          // Distance
          if (time.traveledDistance && time.traveledDistance !== 0)
            row.getCell("distance").value = time.traveledDistance;

          rowIndex++;
        }
      }

      // User Duration
      const row = sheet.getRow(rowIndex);
      const userDurationCell = row.getCell("duration");
      userDurationCell.numFmt = '0,00"h"';
      durationCells.push(userDurationCell.address);

      const durationRow = userDurationCell.address.replace(/\d.*$/, "");

      userDurationCell.value = {
        formula: `SUM(${durationRow}${rowIndex - sortedTimes.length}:${durationRow}${rowIndex - 1})`,
      };

      const userDistanceCell = row.getCell("distance");
      userDistanceCell.numFmt = '0 "km"';
      const distanceRow = userDistanceCell.address.replace(/\d.*$/, "");

      userDistanceCell.value = {
        formula: `SUM(${distanceRow}${rowIndex - sortedTimes.length}:${distanceRow}${rowIndex - 1})`,
      };

      rowIndex += 2;
    });

    // Final Duration
    const lastRow = sheet.getRow(rowIndex);
    const lastDuration = lastRow.getCell("duration");
    lastDuration.numFmt = '0,00"h"';

    lastDuration.value = {
      formula: durationCells.join("+"),
    };
    lastDuration.border = {
      bottom: { style: "double" },
    };

    workbook.xlsx
      .writeBuffer()
      .then((buffer) =>
        FileSaver.saveAs(new Blob([buffer]), `Zeiten Export ${yearMonth}.xlsx`),
      )
      .catch((err) => console.log("Error writing excel export", err));
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
