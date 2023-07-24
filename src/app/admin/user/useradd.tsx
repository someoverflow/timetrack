"use client";

import { ListPlus, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserAdd() {
  const [username, setUsername] = useState("");
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
        <div className="modal-content flex flex-col w-[80%] max-w-sm">
          <div className="w-full flex flex-row justify-between items-center">
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
            <p className="pl-2 text-content2 text-left">Username</p>
            <input
              className="input input-block"
              type="text"
              name="Name"
              id="name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">Password</p>
            <input
              className="input input-block"
              type="password"
              name="Password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">Mail</p>
            <input
              className="input input-block"
              type="email"
              name="Mail"
              id="mail"
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
