"use client";

import "@/lib/types";

import { ListPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChipAdd({ users }: { users: UserMinimal[] }) {
  const [id, setId] = useState("");
  const [user, setUser] = useState(users[0].id);
  const [visible, setVisible] = useState(false);

  const router = useRouter();

  function sendRequest() {
    fetch("/api/chip", {
      method: "POST",
      body: JSON.stringify({
        id: id,
        userId: user,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setId("");
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
      <label className="btn btn-circle" htmlFor="userCreate">
        <ListPlus className="w-1/2 h-1/2" />
      </label>

      <input
        className="modal-state"
        id="userCreate"
        type="checkbox"
        checked={visible}
        onChange={(e) => setVisible(e.target.checked)}
      />
      <div className="modal">
        <label className="modal-overlay" htmlFor="userCreate"></label>
        <div className="admin-main-modal">
          <div className="admin-main-modal-header">
            <h2 className="text-xl text-content1">Create User</h2>
            <div>
              <label
                htmlFor="userCreate"
                className="btn btn-sm btn-circle btn-ghost"
              >
                <XCircle className="w-1/2 h-1/2" />
              </label>
            </div>
          </div>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <p className="pl-2 text-content2 text-left">Chip Id</p>
            <input
              className="input input-block"
              type="text"
              name="Name"
              id="name"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">User</p>
            <select
              className="select select-block"
              name="user"
              id="user-select"
              value={user}
              onChange={(e) => setUser(parseInt(e.target.value))}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.username} ${
                    user.name !== "?" ? `(${user.name})` : ""
                  }`}
                </option>
              ))}
            </select>
          </div>

          <div className="divider"></div>

          <div className="w-full flex flex-row justify-center gap-2">
            <button
              className="btn btn-success btn-circle"
              onClick={() => sendRequest()}
            >
              <ListPlus className="w-1/2 h-1/2" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
