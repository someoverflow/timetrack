"use client";

import "@/lib/types";

import { PencilRuler, SaveAll, Trash, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserEdit({ user }: { user: UserDetails }) {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(
    user.name !== "?" ? user.name : ""
  );
  const [password, setPassword] = useState("");
  const [mail, setMail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  const [visible, setVisible] = useState(false);

  const router = useRouter();

  function sendRequest() {
    fetch("/api/user", {
      method: "POST",
      body: JSON.stringify({
        id: user.id,
        username: username,
        displayName: displayName,
        password: password.trim().length === 0 ? null : password,
        mail: mail,
        role: role,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setPassword("");
          setVisible(false);

          router.refresh();
        }
        console.log(result);
      })
      .catch(console.error);
  }

  function sendDeleteRequest() {
    fetch("/api/user", {
      method: "DELETE",
      body: JSON.stringify({
        id: user.id,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setPassword("");
          setVisible(false);

          router.refresh();
        }
        console.log(result);
      })
      .catch(console.error);
  }

  return (
    <>
      <label className="btn btn-circle" htmlFor={`userEdit-${user.id}`}>
        <PencilRuler className="w-1/2 h-1/2" />
      </label>

      <input
        className="modal-state"
        id={`userEdit-${user.id}`}
        type="checkbox"
        checked={visible}
        onChange={(e) => setVisible(e.target.checked)}
      />
      <div className="modal">
        <label
          className="modal-overlay"
          htmlFor={`userEdit-${user.id}`}
        ></label>
        <div className="admin-main-modal">
          <div className="admin-main-modal-header">
            <h2 className="text-xl text-content1">
              {user.username}{" "}
              <span className="badge badge-flat-primary badge-xs">
                {user.role}
              </span>
            </h2>
            <div>
              <label
                htmlFor={`userEdit-${user.id}`}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <XCircle className="w-1/2 h-1/2" />
              </label>
            </div>
          </div>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <p className="pl-2 text-content2 text-left">Name</p>
            <input
              className="input input-block"
              type="text"
              name="DisplayName"
              id={`userEdit-dname-${user.id}`}
              placeholder={user.name !== "?" ? user.name : "Max Mustermann"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <p className="pl-2 text-content2 text-left">Username</p>
            <input
              className="input input-block"
              type="text"
              name="Name"
              id={`userEdit-name-${user.id}`}
              placeholder={user.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">Password</p>
            <input
              className="input input-block"
              type="password"
              name="Password"
              id={`userEdit-password-${user.id}`}
              placeholder="#SuperSecure123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="divider m-0"></div>

            <p className="pl-2 text-content2 text-left">Mail</p>
            <input
              className="input input-block"
              type="email"
              name="Mail"
              id={`userEdit-mail-${user.id}`}
              placeholder={user.email}
              value={mail}
              onChange={(e) => setMail(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">Role</p>
            <select
              className="select select-block"
              name="role"
              id={`userEdit-role-${user.id}`}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
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
              value={user.updatedAt.toLocaleString()}
              disabled
            />
            <p className="pl-2 text-content2 text-left">Created</p>
            <input
              className="input input-block"
              type="datetime"
              name="Created"
              id="created"
              value={user.createdAt.toLocaleString()}
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
