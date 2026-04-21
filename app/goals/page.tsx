"use client";

import { useEffect, useState } from "react";
import GoalForm from "@/components/GoalForm";
import TaskItem from "@/components/TaskItem";
import PageLoader from "@/components/PageLoader";

type Task = {
  id: string;
  task_text: string;
  status: string;
};
type Goal = {
  id: string;
  goal_text: string;
  deadline: string | null;
  tasks: Task[];
};

export default function GoalsPage() {
  const [data, setData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/goals", { cache: "no-store" });
      const payload = await res.json();
      setData(payload.goals || []);
      setLoading(false);
    };
    run();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      
      {/* 🔥 Updated heading */}
      <h1 className="text-4xl font-bold mb-6">
        My Goals 🎯
      </h1>

      <GoalForm />

      <h2 className="text-2xl mb-4">Your Goals:</h2>

      {loading && <PageLoader title="Loading goals" subtitle="Fetching your goals and tasks..." compact />}
      {data?.length === 0 && <p>No goals yet</p>}

      {data?.map((goal) => (
        <div
          key={goal.id}
          className="bg-gray-800 p-4 rounded mb-4"
        >
          {/* Goal */}
          <p className="text-lg font-semibold">
            {goal.goal_text}
          </p>

          <p className="text-sm text-gray-400 mb-2">
            Deadline: {goal.deadline}
          </p>

          {/* Tasks */}
          {goal.tasks?.length > 0 && (
            <ul className="mt-2">
              {goal.tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          )}
        </div>
      ))}
    </main>
  );
}