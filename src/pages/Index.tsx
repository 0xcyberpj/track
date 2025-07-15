import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-3 pt-safe max-w-7xl">
        <Dashboard />
      </div>
    </>
  );
};

export default Index;
