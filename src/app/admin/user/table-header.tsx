"use client";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ListPlus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function UserTableHeader({
  searchValid,
}: {
  searchValid: boolean;
}) {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  var searchPage = searchParams.get("search");

  const changePage = useDebouncedCallback((value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value.trim() == "") current.delete("search");
    else current.set("search", value);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    push(`/admin/user${query}`);
  }, 300);

  return (
    <div className="flex flex-row p-2 px-4 gap-2 ">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
        <Input
          placeholder="Search for name..."
          onChange={(e) => changePage(e.target.value)}
          defaultValue={searchPage!}
          className={`pl-10 transition-all duration-150 ${
            !searchValid && "border-destructive"
          }`}
        />
      </div>
      <div className="w-max">
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              //onClick={() => setAddVisible(true)}
            >
              <ListPlus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-center">Create a new user</p>
          </TooltipContent>
        </Tooltip>

        {/* <AlertDialog
          key={`userModal-${.id}`}
          open={visible}
          onOpenChange={(e) => setVisible(e)}
        >
          <AlertDialogContent className="w-[95%] max-w-xl rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex flex-row items-center justify-between">
                <div>Edit entry</div>
                <AlertDialogCancel variant="ghost" size="icon">
                  <XCircle className="w-5 h-5" />
                </AlertDialogCancel>
              </AlertDialogTitle>
              <AlertDialogDescription></AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2 min-h-[45dvh]">
              <Tabs defaultValue="notes" className="w-full items-start">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="time">Time</TabsTrigger>
                </TabsList>
                <TabsContent value="notes">
                  <ScrollArea
                    className="h-[45svh] w-full rounded-sm border border-border p-2.5 overflow-hidden"
                    type="always"
                  >
                    <div className="grid w-full py-1 gap-1.5">
                      <Label
                        htmlFor={`timerModal-notes-${data.id}`}
                        className="text-muted-foreground pl-2"
                      >
                        Notes
                      </Label>
                      <div className="h-[35svh] p-1">
                        <Textarea
                          id={`timerModal-notes-${data.id}`}
                          className={`h-full min-h-[10svh] max-h-[50svh] border-2 transition-all duration-300 ${
                            state.notes != (data.notes ? data.notes : "") &&
                            "border-sky-700"
                          }`}
                          spellCheck={true}
                          value={state.notes}
                          onChange={(e) => setState({ notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="time">
                  <ScrollArea
                    className="h-[45svh] w-full rounded-sm border border-border p-2.5 overflow-hidden"
                    type="always"
                  >
                    <div className="grid gap-4 py-1 w-full">
                      <div className="grid w-full items-center gap-1.5">
                        <Label
                          htmlFor="name"
                          className="pl-2 text-muted-foreground"
                        >
                          Start
                        </Label>
                        <Input
                          className={`!w-full font-mono border-2 transition-all duration-300 ${
                            state.start !=
                              data.start
                                .toLocaleString("sv")
                                .replace(" ", "T") && "border-sky-700"
                          }`}
                          type="datetime-local"
                          name="Updated"
                          id="updated"
                          step={1}
                          value={state.start}
                          onChange={(e) => setState({ start: e.target.value })}
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
                          className={`w-full font-mono border-2 transition-all duration-300 ${
                            state.end !=
                              (data.end
                                ? data.end
                                    .toLocaleString("sv")
                                    .replace(" ", "T")
                                : new Date()
                                    .toLocaleString("sv")
                                    .replace(" ", "T")) && "border-sky-700"
                          }`}
                          type="datetime-local"
                          name="Created"
                          id="created"
                          step={1}
                          value={state.end}
                          onChange={(e) => setState({ end: e.target.value })}
                        />
                      </div>

                      <div id="divider" className="h-1" />

                      <div className="grid w-full items-center gap-1.5">
                        <Label
                          htmlFor="start-w"
                          className="pl-2 text-muted-foreground"
                        >
                          Started with
                        </Label>
                        <Input
                          disabled
                          className="w-full font-mono appearance-none"
                          type="text"
                          name="started-with"
                          id="start-w"
                          value={data.startType + ""}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label
                          htmlFor="stopped-w"
                          className="pl-2 text-muted-foreground"
                        >
                          Stopped with
                        </Label>
                        <Input
                          disabled
                          className="w-full font-mono"
                          type="text"
                          name="stopped-with"
                          id="stopped-w"
                          value={data.endType + ""}
                        />
                      </div>

                      <div id="divider" className="h-1" />

                      <div className="grid w-full items-center gap-1.5">
                        <Label
                          htmlFor="id"
                          className="pl-2 text-muted-foreground"
                        >
                          ID
                        </Label>
                        <Input
                          disabled
                          className="w-full font-mono"
                          type="number"
                          name="Id"
                          id="id"
                          value={data.id}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            <AlertDialogFooter className="items-end">
              <Button
                variant="destructive"
                onClick={() => sendDeleteRequest()}
                disabled={state.loading}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => sendRequest()}
                disabled={state.loading}
              >
                <SaveAll className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog> */}
      </div>
    </div>
  );
}
