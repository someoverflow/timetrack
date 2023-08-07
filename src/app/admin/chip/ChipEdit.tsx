"use client";

import { PencilRuler, SaveAll, Trash, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ChipDetails {
  id: string;
  user: {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  updatedAt: Date;
  createdAt: Date;
}
interface User {
  id: number;
  name: string;
  username: string;
}

export default function ChipEdit({
  users,
  chip,
}: {
  users: User[];
  chip: ChipDetails;
}) {
  const [user, setUser] = useState(users[0].id);
  const [visible, setVisible] = useState(false);

  const router = useRouter();

  function sendRequest() {
    fetch("/api/chip", {
      method: "POST",
      body: JSON.stringify({
        id: chip.id,
        userId: user,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setUser(users[0].id);
          setVisible(false);

          router.refresh();
        }
        console.log(result);
      })
      .catch(console.error);
  }

  function sendDeleteRequest() {
    fetch("/api/chip", {
      method: "DELETE",
      body: JSON.stringify({
        id: chip.id,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setUser(users[0].id);
          setVisible(false);

          router.refresh();
        }
        console.log(result);
      })
      .catch(console.error);
  }

  return (
    <>
      <label className="btn btn-circle" htmlFor={`chipEdit-${chip.id}`}>
        <PencilRuler className="w-1/2 h-1/2" />
      </label>

      <input
        className="modal-state"
        id={`chipEdit-${chip.id}`}
        type="checkbox"
        checked={visible}
        onChange={(e) => setVisible(e.target.checked)}
      />
      <div className="modal">
        <label
          className="modal-overlay"
          htmlFor={`chipEdit-${chip.id}`}
        ></label>
        <div className="admin-main-modal">
          <div className="admin-main-modal-header">
            <h2 className="text-xl text-content1">{chip.id}</h2>
            <div>
              <label
                htmlFor={`chipEdit-${chip.id}`}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <XCircle className="w-1/2 h-1/2" />
              </label>
            </div>
          </div>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <p className="pl-2 text-content2 text-left">User</p>
            <select
              className="select select-block"
              name="User"
              id={`chipEdit-user-${chip.id}`}
              value={user}
              onChange={(e) => setUser(parseInt(e.target.value))}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.username} ${user.name !== "?" ? `(${user.name})` : ""}`}
                </option>
              ))}
            </select>
          </div>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <p className="pl-2 text-content2 text-left">Updated</p>
            <input
              className="input input-block"
              type="datetime"
              name="Updated"
              id="updated"
              value={chip.updatedAt.toLocaleString()}
              disabled
            />
            <p className="pl-2 text-content2 text-left">Created</p>
            <input
              className="input input-block"
              type="datetime"
              name="Created"
              id="created"
              value={chip.createdAt.toLocaleString()}
              disabled
            />
          </div>

          <div className="divider"></div>

          <div className="w-full flex flex-row justify-center gap-2">
            <button
              className="btn btn-error btn-circle"
              onClick={() => sendDeleteRequest()}
            >
              <Trash className="w-1/2 h-1/2" />
            </button>
            <button
              className="btn btn-success btn-circle"
              onClick={() => sendRequest()}
            >
              <SaveAll className="w-1/2 h-1/2" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
