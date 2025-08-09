import Link from "next/link";

type Props = { id: string; name: string; asMeId?: string };

export default function ContactCard({ id, name, asMeId = "me" }: Props) {
  return (
    <Link href={`/chat/${id}?as=${encodeURIComponent(asMeId)}`}>
      <div className="w-40 h-28 flex flex-col items-center justify-center border rounded-md shadow-sm hover:shadow-md cursor-pointer m-4">
        <div className="text-sm text-gray-600">{`Card-${id}`}</div>
        <div className="font-semibold mt-1">{name}</div>
        <div className="mt-3 text-sm text-sky-700">Send Text</div>
      </div>
    </Link>
  );
}
