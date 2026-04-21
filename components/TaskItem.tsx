"use client";

import { useState } from "react";

type Task = {
  id: string;
  task_text: string;
  status: string;
};

export default function TaskItem({ task }: { task: Task }) {
  const [status, setStatus] = useState(task.status);

  const toggleStatus = async () => {
    const newStatus =
      status === "completed" ? "not_started" : "completed";

    // instant UI update
    setStatus(newStatus);

    // update DB
    const res = await fetch("/api/update-task", {
      method: "POST",
      body: JSON.stringify({
        taskId: task.id,
        status: newStatus,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert("Failed to update");
      setStatus(task.status); // rollback
    }
  };

  return (
    <li
      onClick={toggleStatus}
      className="flex items-center gap-2 ml-2 text-sm text-gray-300 cursor-pointer"
    >
      <span>
        {status === "completed" ? "✅" : "⬜"}
      </span>

      <span
        className={
          status === "completed"
            ? "line-through text-gray-500"
            : ""
        }
      >
        {task.task_text}
      </span>
    </li>
  );
}