import { ComputerForm } from "@/components/ComputerForm";
import { createComputer } from "@/lib/actions/computers";

export default function NewComputerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium">New computer</h1>
      <ComputerForm action={createComputer} />
    </div>
  );
}
