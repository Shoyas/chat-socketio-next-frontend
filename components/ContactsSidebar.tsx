"use client";

import { useEffect, useState } from "react";
import ContactCard from "./ContactCard";

type Contact = { id: string; name: string };

export default function ContactsSidebar({ selected }: { selected?: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    // fetch(`${process.env.DOMAIN_URL}/api/contacts`)
    fetch(`https://chat-socketio-express-backend.onrender.com/api/contacts`)
      .then((r) => r.json())
      .then(setContacts)
      .catch(() => {
        // fallback sample
        setContacts([
          { id: "nasir", name: "Nasir" },
          { id: "samin", name: "Samin" },
          { id: "jamil", name: "Jamil" },
          { id: "tauhid", name: "Tauhid" },
        ]);
      });
  }, []);

  return (
    <aside className="w-64 border-r p-4">
      <h3 className="text-center font-semibold mb-4">Contact Our Specialists</h3>
      <div className="flex flex-col items-center">
        {contacts.map((c) => (
          <ContactCard key={c.id} id={c.id} name={c.name} />
        ))}
      </div>
    </aside>
  );
}
