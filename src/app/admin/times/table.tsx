"use client";

import { useEffect, useState } from "react";

interface I_Timer {
  id: number;
  user: string;
  start: Date | null;
  startType: string | null;
  end: Date | null;
  endType: string | null;
  time: string | null;
  notes: string | null;
}

export default function Table() {
  const [posts, setPosts] = useState<I_Timer[]>([]);

  function fetchPosts() {
    fetch("/api/times/all")
      .then((result) => result.json())
      .then((result) => {
        setPosts(result.posts);
        console.log(result);
      })
      .catch(console.error);
  }

  // First Fetch
  useEffect(() => fetchPosts(), []);
  // Repeat Fetch
  useEffect(() => {
    const intervalId = setInterval(() => fetchPosts(), 5000);
    return () => clearInterval(intervalId);
  });

  return (
    <>
      <div className="flex w-full overflow-x-auto">
        <table className="table min-w-full max-w-4xl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start</th>
              <th>Ende</th>
              <th>Zeit</th>
            </tr>
          </thead>
          <tbody>
            {posts.length == 0 && (
              <>
                <tr>
                  <th>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </th>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </th>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </th>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </th>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                  <td>
                    <div className="skeleton w-full h-5 rounded-md"></div>
                  </td>
                </tr>
              </>
            )}
            {posts.map((content) => {
              return (
                <tr key={content.id}>
                  <td>
                    <b>{content.user}</b>
                  </td>
                  <td>
                    <input
                      className="input input-sm"
                      disabled
                      name="start"
                      id="id"
                      value={content.start?.toLocaleString()}
                    />
                  </td>
                  <td>
                    <input
                      className="input input-sm"
                      disabled
                      name="start"
                      id="id"
                      value={content.end?.toLocaleString()}
                    />
                  </td>
                  <td>{content.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
