"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import type { ActionState } from "@/lib/actions/computers";

export function ComputerForm({
  action,
  defaultValues,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string; description: string | null };
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div>
        <label className="block text-sm mb-1" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="input"
          placeholder="e.g. Office Desktop"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="input"
          placeholder="Optional notes about this build"
        />
      </div>

      <SubmitButton>{defaultValues ? "Save changes" : "Create computer"}</SubmitButton>
    </form>
  );
}
