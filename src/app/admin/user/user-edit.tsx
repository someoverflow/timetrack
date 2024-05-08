"use client";

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
import {
  Minus,
  PencilRuler,
  Plus,
  SaveAll,
  Trash,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Prisma } from "@prisma/client";

type User = Prisma.userGetPayload<{ include: { projects: true; chips: true } }>;

interface userEditState {
  loading: boolean;
  loadingIndicator: string;
  tag: string;
  name: string | null;
  mail: string;
  role: string;
  password: string;
  chipAdd: string;
}
export default function UserEdit({ user }: { user: User }) {
  const [data, setData] = useReducer(
    (prev: userEditState, next: Partial<userEditState>) => ({
      ...prev,
      ...next,
    }),
    {
      loading: false,
      loadingIndicator: "",
      tag: user.tag,
      name: user.name !== "?" ? user.name : "",
      mail: user.email,
      role: user.role,
      password: "",
      chipAdd: "",
    }
  );
  const [visible, setVisible] = useState(false);

  const router = useRouter();

  async function sendRequest() {
    setData({
      loading: true,
      loadingIndicator: "update",
    });

    const result = await fetch("/api/user", {
      method: "POST",
      body: JSON.stringify({
        id: user.id,
        tag: data.tag,
        name: data.name,
        mail: data.mail,
        role: data.role,
        password: data.password.trim().length === 0 ? undefined : data.password,
      }),
    });

    setData({
      loading: false,
    });

    if (result.ok) {
      setVisible(false);

      setData({
        password: "",
        loadingIndicator: "",
      });

      toast.success("Successfully changed entry", {
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

    if (result.status === 400 && !!resultData.result[1]) {
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

  async function sendDeleteRequest() {
    setData({
      loading: true,
      loadingIndicator: "delete",
    });

    const result = await fetch("/api/user", {
      method: "DELETE",
      body: JSON.stringify({
        id: user.id,
      }),
    });

    setData({
      loading: false,
    });

    if (result.ok) {
      setVisible(false);

      setData({
        loadingIndicator: "",
        password: "",
      });

      toast.success("Successfully deleted entry", {
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

    if (result.status === 400 && !!resultData.result[1]) {
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

  async function sendChipCreateRequest() {
    setData({
      loading: true,
      loadingIndicator: "chipCreate",
    });

    const result = await fetch("/api/chip", {
      method: "POST",
      body: JSON.stringify({
        id: data.chipAdd,
        userId: user.id,
      }),
    });

    setData({
      loadingIndicator: "",
      loading: false,
    });

    if (result.ok) {
      setData({
        chipAdd: "",
      });

      toast.success("Successfully linked chip", {
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

    if (result.status === 400 && !!resultData.result[1]) {
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

  async function sendChipDeleteRequest(chip: string) {
    setData({
      loading: true,
      loadingIndicator: `chipDelete-${chip}`,
    });

    const result = await fetch("/api/chip", {
      method: "DELETE",
      body: JSON.stringify({
        id: chip,
      }),
    });

    setData({
      loadingIndicator: "",
      loading: false,
    });

    if (result.ok) {
      setData({
        chipAdd: "",
      });

      toast.success("Successfully removed chip", {
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

    if (result.status === 400 && !!resultData.result[1]) {
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
    <>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => {
          setVisible(!visible);

          setData({
            tag: user.tag,
            name: user.name !== "?" ? user.name : "",
            mail: user.email,
            role: user.role,
            password: "",
          });
        }}
      >
        <PencilRuler className="h-5 w-5" />
      </Button>

      <Dialog
        key={`userModal-${user.id}`}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>
              <div>Edit entry</div>
            </DialogTitle>
          </DialogHeader>

          <div className="w-full flex flex-col gap-2">
            <Tabs defaultValue="preferences">
              <TabsList className="grid w-full grid-cols-2 h-fit">
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="chips">Chips</TabsTrigger>
              </TabsList>
              <TabsContent value="preferences">
                <ScrollArea
                  className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                  type="always"
                >
                  <div className="grid gap-4 p-1 w-full">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="loginName"
                        className="pl-2 text-muted-foreground"
                      >
                        Login Name
                      </Label>
                      <Input
                        className={`w-full border-2 transition duration-300 ${
                          user.tag !== (data.tag ? data.tag : "") &&
                          "border-sky-700"
                        }`}
                        disabled={data.tag === "admin"}
                        type="text"
                        name="Login Name"
                        id="loginName"
                        value={data.tag}
                        onChange={(e) => setData({ tag: e.target.value })}
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="name"
                        className="pl-2 text-muted-foreground"
                      >
                        Name
                      </Label>
                      <Input
                        className={`w-full border-2 transition duration-300 ${
                          user.name !== (data.name ? data.name : "") &&
                          "border-sky-700"
                        }`}
                        type="text"
                        name="Name"
                        id="name"
                        value={data.name ?? ""}
                        onChange={(e) => setData({ name: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="userAdd-mail"
                        className="pl-2 text-muted-foreground"
                      >
                        Mail
                      </Label>
                      <Input
                        className={`w-full border-2 transition duration-300 ${
                          user.email !== (data.mail ? data.mail : "") &&
                          "border-sky-700"
                        }`}
                        type="email"
                        name="Mail"
                        id="userAdd-mail"
                        placeholder="max@muster.com"
                        value={data.mail}
                        onChange={(e) => setData({ mail: e.target.value })}
                      />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="userAdd-role"
                        className="pl-2 text-muted-foreground"
                      >
                        Role
                      </Label>
                      <Select
                        key="userAdd-role"
                        disabled={data.tag === "admin"}
                        value={data.role}
                        onValueChange={(role) => setData({ role: role })}
                      >
                        <SelectTrigger
                          className={`w-full border-2 transition duration-300 ${
                            user.role !== data.role && "border-sky-700"
                          }`}
                        >
                          <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
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
                        value={user.id}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="chips" className="h-full">
                <ScrollArea
                  className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                  type="always"
                >
                  <div className="grid gap-4 p-1 w-full">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="id"
                        className="pl-2 text-muted-foreground"
                      >
                        Add new chip
                      </Label>
                      <div className="flex w-full items-center space-x-2">
                        <Input
                          className="w-full font-mono"
                          type="text"
                          name="Chip Add"
                          id="chip-add"
                          value={data.chipAdd}
                          onChange={(e) => setData({ chipAdd: e.target.value })}
                        />
                        <div className="w-max">
                          <Button
                            disabled={data.loading}
                            size="icon"
                            onClick={() => sendChipCreateRequest()}
                          >
                            {data.loading &&
                            data.loadingIndicator === "chipCreate" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div id="divider" className="h-1" />

                    {user.chips.map((chip) => (
                      <div
                        key={`chip-list-${chip.id}`}
                        className="flex w-full items-center space-x-2"
                      >
                        <div className="w-full rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                          {chip.id}
                        </div>
                        <div className="w-max">
                          <Button
                            disabled={data.loading}
                            variant="secondary"
                            size="icon"
                            onClick={() => sendChipDeleteRequest(chip.id)}
                          >
                            {data.loading &&
                            data.loadingIndicator ===
                              `chipDelete-${chip.id}` ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Minus className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="w-full gap-2 flex flex-row justify-end">
              <Button
                variant="destructive"
                onClick={() => sendDeleteRequest()}
                disabled={data.loading || user.id === 1}
              >
                {data.loading && data.loadingIndicator === "delete" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => sendRequest()}
                disabled={data.loading}
              >
                {data.loading && data.loadingIndicator === "update" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SaveAll className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
