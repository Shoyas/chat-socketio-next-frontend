import "./globals.css";
import { PropsWithChildren } from "react";

export const metadata = {
  title: "Chat App",
  description: "Socket.IO Next.js chat"
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
