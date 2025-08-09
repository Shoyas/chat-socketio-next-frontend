import ContactsSidebar from "../components/ContactsSidebar";

export default function Home() {
  return (
    <main className="flex items-start justify-center pt-8">
      <div className="w-full max-w-5xl flex justify-center">
        <div>
          <h1 className="text-center text-2xl font-semibold mb-6">Contact Our Specialists</h1>
          <div className="flex flex-wrap justify-center">
            {/* Grid of all specialists; clicking opens chat as user "me" */}
            <ContactsSidebar />
          </div>
        </div>
      </div>
    </main>
  );
}
