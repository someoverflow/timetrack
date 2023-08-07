"use client";

import { ListPlus, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserAdd() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [mail, setMail] = useState("");
  const [role, setRole] = useState("user");

  const [visible, setVisible] = useState(false);

  const router = useRouter();

  function sendRequest() {
    fetch("/api/user", {
      method: "PUT",
      body: JSON.stringify({
        username: username,
        displayName: displayName,
        email: mail,
        password: password,
        role: role,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        setUsername("");
        setPassword("");
        setMail("");
        setRole("user");

        setVisible(false);

        router.refresh();
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

            <p className="pl-2 text-content2 text-left">Name</p>
            <input
              className="input input-block"
              type="text"
              name="Name"
              id="name"
              placeholder="Max Mustermann"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <p className="pl-2 text-content2 text-left">Username</p>
            <input
              className="input input-block"
              type="text"
              name="Name"
              id="name"
              placeholder="maxmust"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <p className="pl-2 text-content2 text-left">Password</p>
            <input
              className="input input-block"
              type="password"
              name="Password"
              id="password"
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
              id="mail"
              placeholder="max@muster.com"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">Role</p>
            <select
              className="select select-block"
              name="role"
              id="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="divider"></div>

          <div className="w-full flex flex-row justify-center gap-2">
            <button
              className="btn btn-success btn-circle"
              onClick={() => sendRequest()}
            >
              <UserPlus className="w-1/2 h-1/2" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
