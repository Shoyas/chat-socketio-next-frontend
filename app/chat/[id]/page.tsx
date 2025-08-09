import RecentContactsSidebar from "../../../components/RecentContactsSidebar";
import ChatWindow from "../../../components/ChatWindow";

type Props = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function ChatPage({ params, searchParams }: Props) {
  const meIdRaw = searchParams["as"];
  const meId = Array.isArray(meIdRaw) ? meIdRaw[0] : meIdRaw || "me";

  const otherId = params.id;
  const nameMap: Record<string, string> = {
    nasir: "Nasir",
    samin: "Samin",
    jamil: "Jamil",
    tauhid: "Tauhid",
    me: "You",
  };
  const otherName = nameMap[otherId] ?? otherId;

  return (
    <div className="h-screen flex">
      <RecentContactsSidebar meId={meId} selected={otherId} />
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center gap-4">
          <div className="rounded-full w-10 h-10 bg-gray-300" />
          <div>
            <div className="font-semibold">{otherName}</div>
            <div className="text-xs text-gray-500">online</div>
          </div>
          <div className="ml-auto text-sm text-gray-600">
            You are chatting as: <span className="font-semibold">{meId}</span>
          </div>
        </div>
        <div className="flex-1">
          <ChatWindow meId={meId} otherId={otherId} otherName={otherName} />
        </div>
      </div>
    </div>
  );
}
