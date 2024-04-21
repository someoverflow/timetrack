"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListPlus, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";

export default function UserAdd() {
  const [data, setData] = useReducer(
    (prev: any, next: any) => ({
      ...prev,
      ...next,
    }),
    {
      loading: false,
      tag: "",
      name: "",
      password: "",
      mail: "",
      role: "user",
    }
  );

  const [visible, setVisible] = useState(false);

  const router = useRouter();

  async function sendRequest() {
    setData({
      loading: true,
    });

    const result = await fetch("/api/user", {
      method: "PUT",
      body: JSON.stringify({
        tag: data.tag,
        name: data.name,
        email: data.mail,
        password: data.password,
        role: data.role,
      }),
    });

    setData({
      loading: false,
    });

    if (result.ok) {
      setVisible(false);

      setData({
        tag: "",
        name: "",
        password: "",
        mail: "",
        role: "user",
      });

      toast.success("Successfully created user", {
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
    <>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setVisible(true)}
          >
            <ListPlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-center">Create a new user</p>
        </TooltipContent>
      </Tooltip>

      <Dialog
        key={`userAddModal`}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>
              <div>Create entry</div>
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className="w-full flex flex-col gap-2">
            <ScrollArea
              className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
              type="always"
            >
              <div className="grid gap-4 p-1 w-full">
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="userAdd-username"
                    className="pl-2 text-muted-foreground"
                  >
                    Login Name
                  </Label>
                  <Input
                    className="!w-full font-mono border-2"
                    type="text"
                    name="Name"
                    id="userAdd-username"
                    placeholder="maxmust"
                    value={data.tag}
                    onChange={(e) => setData({ tag: e.target.value })}
                  />
                </div>

                <div id="divider" className="h-1" />
                
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="userAdd-login-name"
                    className="pl-2 text-muted-foreground"
                  >
                    Name
                  </Label>
                  <Input
                    className="!w-full font-mono border-2"
                    type="text"
                    name="Name"
                    id="userAdd-login-name"
                    placeholder="Max Mustermann"
                    value={data.name}
                    onChange={(e) => setData({ name: e.target.value })}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="userAdd-password"
                    className="pl-2 text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    className="!w-full font-mono border-2"
                    type="password"
                    name="Password"
                    id="userAdd-password"
                    placeholder="#SuperSecure123"
                    value={data.password}
                    onChange={(e) => setData({ password: e.target.value })}
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
                    className="!w-full font-mono border-2"
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
                    value={data.role}
                    onValueChange={(role) => setData({ role: role })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>

            <div className="w-full gap-2 flex flex-row justify-end">
              <Button
                variant="outline"
                onClick={() => sendRequest()}
                disabled={data.loading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
