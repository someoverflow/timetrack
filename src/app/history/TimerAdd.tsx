"use client";

import {ListPlus, XCircle} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

export default function TimerAdd({username}: { username: string }) {
    const [start, setStart] = useState(
        new Date().toLocaleString("sv").replace(" ", "T")
    );
    const [end, setEnd] = useState(
        new Date().toLocaleString("sv").replace(" ", "T")
    );

    const [notes, setNotes] = useState("");

    const [visible, setVisible] = useState(false);

    const router = useRouter();

    function sendRequest() {
        fetch("/api/times", {
            method: "PUT",
            body: JSON.stringify({
                username: username,
                notes: notes,
                start: new Date(start).toUTCString(),
                end: new Date(end).toUTCString(),
                startType: "Website",
                endType: "Website",
            }),
        })
            .then((result) => result.json())
            .then((result) => {
                setStart(new Date().toLocaleString("sv").replace(" ", "T"));
                setEnd(new Date().toLocaleString("sv").replace(" ", "T"));
                setNotes("");

                setVisible(false);

                router.refresh();
                console.log(result);
            })
            .catch(console.error);
    }

    return (
        <>
            <label className="btn btn-circle" htmlFor="timerCreate">
                <ListPlus className="w-1/2 h-1/2"/>
            </label>

            <input
                className="modal-state"
                id="timerCreate"
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
            />
            <div className="modal">
                <label className="modal-overlay" htmlFor="timerCreate"></label>
                <div className="admin-main-modal !max-w-xl">
                    <div className="admin-main-modal-header">
                        <h2 className="text-xl text-content1">Add Time</h2>
                        <div>
                            <label
                                htmlFor="timerCreate"
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                <XCircle className="w-1/2 h-1/2"/>
                            </label>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="w-full flex flex-col gap-2">
                        <p className="pl-2 text-content2 text-left">Notes</p>
                        <textarea
                            className="textarea textarea-block min-h-[25vh]"
                            spellCheck={true}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="divider"></div>

                    <div className="flex flex-col gap-2">
                        <p className="pl-2 text-content2 text-left">Start</p>
                        <input
                            className="input input-block"
                            type="datetime-local"
                            name="Updated"
                            id="updated"
                            step={1}
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                        />
                        <p className="pl-2 text-content2 text-left">End</p>
                        <input
                            className="input input-block"
                            type="datetime-local"
                            name="Created"
                            id="created"
                            step={1}
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                    </div>

                    <div className="divider"></div>

                    <div className="w-full flex flex-row justify-center gap-2">
                        <button
                            className="btn btn-success btn-circle"
                            onClick={() => sendRequest()}
                        >
                            <ListPlus className="w-1/2 h-1/2"/>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
