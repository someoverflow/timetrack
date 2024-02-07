"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ListPlus, SaveAll, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";

export default function TimerAdd({
  username,
  visible,
  setVisible,
}: {
  username: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const [data, setData] = useReducer(
    (prev: any, next: any) => ({
      ...prev,
      ...next,
    }),
    {
      start: new Date().toLocaleString("sv").replace(" ", "T"),
      end: new Date().toLocaleString("sv").replace(" ", "T"),
      notes: "",
      loading: false,
    }
  );

  const router = useRouter();

  async function sendRequest() {
    setData({
      loading: true,
    });

    const result = await fetch("/api/times", {
      method: "POST",
      body: JSON.stringify({
        username: username,
        notes: data.notes,
        start: new Date(data.start).toUTCString(),
        end: new Date(data.end).toUTCString(),
        startType: "Website",
        endType: "Website",
      }),
    });

    setData({
      loading: false,
    });

    if (result.ok) {
      setData({
        start: new Date().toLocaleString("sv").replace(" ", "T"),
        end: new Date().toLocaleString("sv").replace(" ", "T"),
        notes: "",
      });
      setVisible(false);

      toast.success("Successfully created new entry", {
        duration: 3000,
      });
      router.refresh();
      return;
    }

    const resultData: APIResult = await result.json().catch(() => {
      toast.error("An error occurred", {
        description: "Result could not be proccessed",
        important: true,
        duration: 8000,
      });
      return;
    });
    if (!resultData) return;

    if (result.status == 400 && !!resultData.result[1]) {
      toast.warning(`An error occurred (${resultData.result[0]})`, {
        description: resultData.result[1],
        important: true,
        duration: 10000,
      });
      return;
    }

    toast.error("An error occurred", {
      description: "Error could not be identified. You can try again.",
      important: true,
      duration: 8000,
    });
  }

  return (
    <AlertDialog
      key={`timerModal-${data.id}`}
      open={visible}
      onOpenChange={(e) => setVisible(e)}
    >
      <AlertDialogContent className="w-[95%] max-w-xl rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-row items-center justify-between">
            <div>Create entry</div>
            <AlertDialogCancel variant="ghost" size="icon">
              <XCircle className="w-5 h-5" />
            </AlertDialogCancel>
          </AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 min-h-[45dvh]">
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
            </TabsList>
            <TabsContent value="notes">
              <Separator orientation="horizontal" className="w-full" />
              <div className="grid w-full gap-1.5 py-4">
                <Label
                  htmlFor={`timerModal-notes-${data.id}`}
                  className="text-muted-foreground pl-2"
                >
                  Notes
                </Label>
                <Textarea
                  id={`timerModal-notes-${data.id}`}
                  className="min-h-[25dvh] max-h-[55dvh]"
                  spellCheck={true}
                  value={data.notes}
                  onChange={(e) => setData({ notes: e.target.value })}
                />
              </div>
            </TabsContent>
            <TabsContent value="time">
              <Separator orientation="horizontal" className="w-full" />
              <div className="grid gap-4 py-4 w-full">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="name" className="pl-2 text-muted-foreground">
                    Start
                  </Label>
                  <Input
                    className="w-full font-mono"
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
                    End
                  </Label>
                  <Input
                    className="w-full font-mono"
                    type="datetime-local"
                    name="Created"
                    id="created"
                    step={1}
                    value={data.end}
                    onChange={(e) => setData({ end: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator orientation="horizontal" className="w-full" />

        <AlertDialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => sendRequest()}
            disabled={data.loading}
          >
            <SaveAll className="mr-2 h-4 w-4" />
            Create Entry
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
