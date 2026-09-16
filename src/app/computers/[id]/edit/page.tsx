import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ComputerForm } from "@/components/ComputerForm";
import { updateComputer } from "@/lib/actions/computers";

export const dynamic = "force-dynamic";

export default async function EditComputerPage({ params }: { params: { id: string } }) {
  const computer = await prisma.computer.findUnique({ where: { id: params.id } });
  if (!computer) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium">Edit {computer.name}</h1>
      <ComputerForm action={updateComputer.bind(null, computer.id)} defaultValues={computer} />
    </div>
  );
}
