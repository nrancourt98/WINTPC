"use client";

import { useFormState } from "react-dom";
import type { PartCategory } from "@prisma/client";
import { SubmitButton } from "@/components/SubmitButton";
import { CATEGORIES, type FieldDef } from "@/lib/categories";
import type { ActionState } from "@/lib/actions/computers";

interface PartFormProps {
  category: PartCategory;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    label: string;
    notes: string | null;
    imageUrl: string | null;
    specs: Record<string, unknown>;
  };
}

export function PartForm({ category, action, defaultValues }: PartFormProps) {
  const [state, formAction] = useFormState(action, {});
  const def = CATEGORIES[category];

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <input type="hidden" name="category" value={category} />

      <div>
        <label className="block text-sm mb-1" htmlFor="label">
          Name
        </label>
        <input
          id="label"
          name="label"
          required
          defaultValue={defaultValues?.label}
          className="input"
          placeholder={`e.g. ${def.label} model name`}
        />
      </div>

      {def.fields.map((field) => (
        <FieldInput key={field.key} field={field} defaultValue={defaultValues?.specs[field.key]} />
      ))}

      <div>
        <label className="block text-sm mb-1" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          className="input"
          placeholder="Anything else worth remembering"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="image">
          Photo
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="input"
        />
        {defaultValues?.imageUrl && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/uploads/${defaultValues.imageUrl}`}
              alt=""
              className="h-16 w-16 rounded object-cover"
            />
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <input type="checkbox" name="removeImage" /> Remove photo
            </label>
          </div>
        )}
      </div>

      <SubmitButton>{defaultValues ? "Save changes" : "Add part"}</SubmitButton>
    </form>
  );
}

function FieldInput({ field, defaultValue }: { field: FieldDef; defaultValue?: unknown }) {
  const value = defaultValue === undefined || defaultValue === null ? "" : String(defaultValue);

  return (
    <div>
      <label className="block text-sm mb-1" htmlFor={field.key}>
        {field.label}
        {field.unit ? ` (${field.unit})` : ""}
      </label>
      {field.type === "select" ? (
        <select id={field.key} name={field.key} defaultValue={value} className="input">
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.key}
          name={field.key}
          type={field.type === "number" ? "number" : "text"}
          step={field.type === "number" ? "any" : undefined}
          defaultValue={value}
          className="input"
        />
      )}
    </div>
  );
}
